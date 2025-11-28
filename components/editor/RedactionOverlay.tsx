'use client';

import { useCallback, useMemo } from 'react';
import { useDocumentStore } from '@/lib/store';
import type { RedactionBox, EntityType } from '@/types';
import { ENTITY_COLORS } from '@/types';

interface RedactionOverlayProps {
  boxes: RedactionBox[];
  viewport: any;
  canvasWidth: number;
  canvasHeight: number;
}

export default function RedactionOverlay({ 
  boxes, 
  viewport, 
  canvasWidth, 
  canvasHeight 
}: RedactionOverlayProps) {
  const detectedEntities = useDocumentStore((state) => state.detectedEntities);
  const hoveredEntityId = useDocumentStore((state) => state.hoveredEntityId);
  const selectedEntityId = useDocumentStore((state) => state.selectedEntityId);

  const getEntityType = useCallback((entityId: string): EntityType => {
    const entity = detectedEntities.find((e) => e.id === entityId);
    return entity?.type || 'CUSTOM';
  }, [detectedEntities]);

  const handleBoxClick = useCallback((box: RedactionBox) => {
    const store = useDocumentStore.getState();
    store.setSelectedEntityId(box.entityId);
    
    // Toggle status on click
    if (box.status === 'pending') {
      store.updateRedactionStatus(box.id, 'confirmed');
    } else if (box.status === 'confirmed') {
      store.updateRedactionStatus(box.id, 'rejected');
    } else {
      store.updateRedactionStatus(box.id, 'pending');
    }
  }, []);

  const handleHover = useCallback((id: string | null) => {
    useDocumentStore.getState().setHoveredEntityId(id);
  }, []);

  if (!viewport || canvasWidth === 0 || canvasHeight === 0) {
    return null;
  }

  return (
    <svg
      className="absolute top-0 left-0 pointer-events-none"
      width={canvasWidth}
      height={canvasHeight}
      style={{ pointerEvents: 'none' }}
    >
      {boxes.map((box) => {
        const entityType = getEntityType(box.entityId);
        const colors = ENTITY_COLORS[entityType];
        const isHovered = hoveredEntityId === box.entityId;
        const isSelected = selectedEntityId === box.entityId;
        
        // Calculate opacity based on status
        let opacity = 0.5;
        if (box.status === 'confirmed') opacity = 0.8;
        if (box.status === 'rejected') opacity = 0.2;
        if (isHovered || isSelected) opacity = Math.min(opacity + 0.2, 1);

        // Scale coordinates based on viewport
        const scaledX = box.x;
        const scaledY = box.y;
        const scaledWidth = box.width;
        const scaledHeight = box.height;

        return (
          <g key={box.id} style={{ pointerEvents: 'auto' }}>
            {/* Background fill */}
            <rect
              x={scaledX}
              y={scaledY}
              width={scaledWidth}
              height={scaledHeight}
              fill={box.status === 'confirmed' ? '#000' : colors.fill}
              fillOpacity={opacity}
              rx={2}
              ry={2}
              className="cursor-pointer transition-all duration-150"
              onClick={() => handleBoxClick(box)}
              onMouseEnter={() => handleHover(box.entityId)}
              onMouseLeave={() => handleHover(null)}
            />
            
            {/* Border */}
            <rect
              x={scaledX}
              y={scaledY}
              width={scaledWidth}
              height={scaledHeight}
              fill="none"
              stroke={box.status === 'confirmed' ? '#000' : colors.stroke}
              strokeWidth={isHovered || isSelected ? 2 : 1}
              strokeDasharray={box.status === 'pending' ? '4,2' : 'none'}
              rx={2}
              ry={2}
              className="pointer-events-none"
            />
            
            {/* Status indicator for rejected */}
            {box.status === 'rejected' && (
              <line
                x1={scaledX}
                y1={scaledY}
                x2={scaledX + scaledWidth}
                y2={scaledY + scaledHeight}
                stroke={colors.stroke}
                strokeWidth={1}
                opacity={0.5}
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}
