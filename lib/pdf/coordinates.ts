// Coordinate mapping utilities for PDF redaction

import type { Entity, RedactionBox, PageTextContent } from '@/types';
import { getTextItemsWithPositions } from './reader';

/**
 * Map entity positions (text indices) to PDF coordinates
 */
export async function mapEntitiesToRedactionBoxes(
  entities: (Omit<Entity, 'id'> | Entity)[],
  textContent: PageTextContent[],
  pdfDocument: any,
  scale: number = 1.0
): Promise<Omit<RedactionBox, 'id'>[]> {
  const boxes: Omit<RedactionBox, 'id'>[] = [];
  
  // Group entities by page for efficient processing
  const entitiesByPage = new Map<number, (Omit<Entity, 'id'> | Entity)[]>();
  for (const entity of entities) {
    const pageEntities = entitiesByPage.get(entity.page) || [];
    pageEntities.push(entity);
    entitiesByPage.set(entity.page, pageEntities);
  }
  
  // Process each page
  for (const [pageNum, pageEntities] of entitiesByPage) {
    const pageContent = textContent.find((p) => p.page === pageNum);
    if (!pageContent) continue;
    
    const { items, viewport } = await getTextItemsWithPositions(pdfDocument, pageNum, scale);
    
    for (const entity of pageEntities) {
      // Find the text items that correspond to this entity
      const entityBoxes = findEntityBoxes(entity, pageContent.text, items);
      
      // Get entity ID if it exists
      const entityId = 'id' in entity ? entity.id : '';
      
      for (const box of entityBoxes) {
        boxes.push({
          entityId: entityId,
          page: pageNum,
          x: box.x,
          y: box.y,
          width: box.width,
          height: box.height,
          status: 'pending',
        });
      }
    }
  }
  
  return boxes;
}

/**
 * Find the bounding boxes for an entity within the text items
 */
function findEntityBoxes(
  entity: Omit<Entity, 'id'> | Entity,
  fullText: string,
  items: Array<{
    str: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }>
): Array<{ x: number; y: number; width: number; height: number }> {
  const boxes: Array<{ x: number; y: number; width: number; height: number }> = [];
  const entityText = entity.text;
  
  // Search through each text item for the entity text
  for (const item of items) {
    const idx = item.str.indexOf(entityText);
    if (idx !== -1) {
      // Calculate the proportional position within the text item
      const charWidth = item.width / item.str.length;
      
      const startX = item.x + (idx * charWidth);
      const width = entityText.length * charWidth;
      
      const padding = 5;
      boxes.push({
        x: startX - padding,
        y: item.y - padding,
        width: width + padding * 2,
        height: item.height + padding * 2,
      });
      
      // Found it, return (we only need one box per entity)
      return boxes;
    }
  }
  
  // If not found in a single item, search across consecutive items
  // Build concatenated text with item boundaries
  let concatenated = '';
  const itemBoundaries: Array<{ start: number; end: number; itemIndex: number }> = [];
  
  for (let i = 0; i < items.length; i++) {
    const start = concatenated.length;
    concatenated += items[i].str;
    itemBoundaries.push({ start, end: concatenated.length, itemIndex: i });
    concatenated += ' '; // Add space between items
  }
  
  // Search for entity in concatenated text
  const foundIndex = concatenated.indexOf(entityText);
  if (foundIndex !== -1) {
    const endIndex = foundIndex + entityText.length;
    
    // Find which items are involved
    const involvedItems: Array<{
      item: typeof items[0];
      startChar: number;
      endChar: number;
    }> = [];
    
    for (const boundary of itemBoundaries) {
      const item = items[boundary.itemIndex];
      
      // Check if this item overlaps with our entity
      if (boundary.end > foundIndex && boundary.start < endIndex) {
        // Calculate which characters of this item are part of the entity
        const itemStartInEntity = Math.max(0, foundIndex - boundary.start);
        const itemEndInEntity = Math.min(item.str.length, endIndex - boundary.start);
        
        if (itemEndInEntity > itemStartInEntity) {
          involvedItems.push({
            item,
            startChar: itemStartInEntity,
            endChar: itemEndInEntity,
          });
        }
      }
    }
    
    if (involvedItems.length > 0) {
      // Calculate bounding box for all involved items
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      
      for (const { item, startChar, endChar } of involvedItems) {
        const charWidth = item.width / Math.max(item.str.length, 1);
        const x = item.x + (startChar * charWidth);
        const width = (endChar - startChar) * charWidth;
        
        minX = Math.min(minX, x);
        minY = Math.min(minY, item.y);
        maxX = Math.max(maxX, x + width);
        maxY = Math.max(maxY, item.y + item.height);
      }
      
      const padding = 5;
      boxes.push({
        x: minX - padding,
        y: minY - padding,
        width: maxX - minX + padding * 2,
        height: maxY - minY + padding * 2,
      });
    }
  }
  
  return boxes;
}

/**
 * Link redaction boxes to their entities by setting entityId
 */
export function linkBoxesToEntities(
  entities: Entity[],
  boxes: Omit<RedactionBox, 'id'>[]
): Omit<RedactionBox, 'id'>[] {
  // This is a simplified approach - in production you'd want more sophisticated matching
  const linkedBoxes: Omit<RedactionBox, 'id'>[] = [];
  let boxIndex = 0;
  
  for (const entity of entities) {
    // Find boxes on the same page
    while (boxIndex < boxes.length && boxes[boxIndex].page === entity.page) {
      linkedBoxes.push({
        ...boxes[boxIndex],
        entityId: entity.id,
      });
      boxIndex++;
    }
  }
  
  return linkedBoxes;
}
