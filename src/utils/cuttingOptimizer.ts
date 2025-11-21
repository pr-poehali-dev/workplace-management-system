export interface Detail {
  name: string;
  width: number;
  height: number;
  quantity: number;
}

export interface Sheet {
  width: number;
  height: number;
  name: string;
}

export interface PlacedDetail {
  detail: Detail;
  x: number;
  y: number;
  rotated: boolean;
}

export interface OptimizedSheet {
  sheet: Sheet;
  placedDetails: PlacedDetail[];
  efficiency: number;
  wasteArea: number;
}

export interface OptimizationResult {
  sheets: OptimizedSheet[];
  totalSheets: number;
  totalEfficiency: number;
  unplacedDetails: Detail[];
}

export function parseDetailSize(size: string): { width: number; height: number } | null {
  const match = size.match(/(\d+)\s*[xх×*]\s*(\d+)/i);
  if (match) {
    return {
      width: parseInt(match[1]),
      height: parseInt(match[2])
    };
  }
  return null;
}

function canFit(
  detail: Detail,
  x: number,
  y: number,
  sheetWidth: number,
  sheetHeight: number,
  rotated: boolean = false
): boolean {
  const detailWidth = rotated ? detail.height : detail.width;
  const detailHeight = rotated ? detail.width : detail.height;
  
  return x + detailWidth <= sheetWidth && y + detailHeight <= sheetHeight;
}

function findBestPosition(
  detail: Detail,
  placedDetails: PlacedDetail[],
  sheetWidth: number,
  sheetHeight: number
): { x: number; y: number; rotated: boolean } | null {
  const positions = [{ x: 0, y: 0 }];
  
  placedDetails.forEach(placed => {
    const placedWidth = placed.rotated ? placed.detail.height : placed.detail.width;
    const placedHeight = placed.rotated ? placed.detail.width : placed.detail.height;
    
    positions.push({
      x: placed.x + placedWidth,
      y: placed.y
    });
    positions.push({
      x: placed.x,
      y: placed.y + placedHeight
    });
  });
  
  positions.sort((a, b) => {
    if (a.y === b.y) return a.x - b.x;
    return a.y - b.y;
  });
  
  for (const pos of positions) {
    let overlaps = false;
    
    for (const rotated of [false, true]) {
      if (!canFit(detail, pos.x, pos.y, sheetWidth, sheetHeight, rotated)) {
        continue;
      }
      
      const detailWidth = rotated ? detail.height : detail.width;
      const detailHeight = rotated ? detail.width : detail.height;
      
      overlaps = false;
      for (const placed of placedDetails) {
        const placedWidth = placed.rotated ? placed.detail.height : placed.detail.width;
        const placedHeight = placed.rotated ? placed.detail.width : placed.detail.height;
        
        if (!(pos.x + detailWidth <= placed.x ||
              pos.x >= placed.x + placedWidth ||
              pos.y + detailHeight <= placed.y ||
              pos.y >= placed.y + placedHeight)) {
          overlaps = true;
          break;
        }
      }
      
      if (!overlaps) {
        return { x: pos.x, y: pos.y, rotated };
      }
    }
  }
  
  return null;
}

export function optimizeCutting(
  details: Detail[],
  sheets: Sheet[]
): OptimizationResult {
  const sortedDetails = [...details].sort((a, b) => {
    const areaA = a.width * a.height;
    const areaB = b.width * b.height;
    return areaB - areaA;
  });
  
  const expandedDetails: Detail[] = [];
  sortedDetails.forEach(detail => {
    for (let i = 0; i < detail.quantity; i++) {
      expandedDetails.push({ ...detail, quantity: 1 });
    }
  });
  
  const optimizedSheets: OptimizedSheet[] = [];
  const unplacedDetails: Detail[] = [];
  
  let currentSheetIndex = 0;
  let currentSheet: OptimizedSheet | null = null;
  
  for (const detail of expandedDetails) {
    let placed = false;
    
    if (currentSheet) {
      const position = findBestPosition(
        detail,
        currentSheet.placedDetails,
        currentSheet.sheet.width,
        currentSheet.sheet.height
      );
      
      if (position) {
        currentSheet.placedDetails.push({
          detail,
          x: position.x,
          y: position.y,
          rotated: position.rotated
        });
        placed = true;
      }
    }
    
    if (!placed) {
      if (currentSheet) {
        const usedArea = currentSheet.placedDetails.reduce((sum, pd) => {
          return sum + (pd.detail.width * pd.detail.height);
        }, 0);
        const sheetArea = currentSheet.sheet.width * currentSheet.sheet.height;
        currentSheet.efficiency = (usedArea / sheetArea) * 100;
        currentSheet.wasteArea = sheetArea - usedArea;
        optimizedSheets.push(currentSheet);
      }
      
      let sheetForDetail: Sheet | null = null;
      for (const sheet of sheets) {
        if (canFit(detail, 0, 0, sheet.width, sheet.height, false) ||
            canFit(detail, 0, 0, sheet.width, sheet.height, true)) {
          sheetForDetail = sheet;
          break;
        }
      }
      
      if (!sheetForDetail) {
        unplacedDetails.push(detail);
        currentSheet = null;
        continue;
      }
      
      const rotated = !canFit(detail, 0, 0, sheetForDetail.width, sheetForDetail.height, false);
      
      currentSheet = {
        sheet: sheetForDetail,
        placedDetails: [{
          detail,
          x: 0,
          y: 0,
          rotated
        }],
        efficiency: 0,
        wasteArea: 0
      };
      currentSheetIndex++;
    }
  }
  
  if (currentSheet && currentSheet.placedDetails.length > 0) {
    const usedArea = currentSheet.placedDetails.reduce((sum, pd) => {
      return sum + (pd.detail.width * pd.detail.height);
    }, 0);
    const sheetArea = currentSheet.sheet.width * currentSheet.sheet.height;
    currentSheet.efficiency = (usedArea / sheetArea) * 100;
    currentSheet.wasteArea = sheetArea - usedArea;
    optimizedSheets.push(currentSheet);
  }
  
  const totalEfficiency = optimizedSheets.length > 0
    ? optimizedSheets.reduce((sum, s) => sum + s.efficiency, 0) / optimizedSheets.length
    : 0;
  
  return {
    sheets: optimizedSheets,
    totalSheets: optimizedSheets.length,
    totalEfficiency,
    unplacedDetails
  };
}
