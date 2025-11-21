import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Управление складом с учетом остатков по материалам и цветам
    Args: event с httpMethod для просмотра склада
    Returns: HTTP response с данными склада
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        if method == 'GET':
            cursor.execute("""
                SELECT w.*, m.name as material_name, c.name as color_name, s.name as section_name
                FROM warehouse w
                JOIN materials m ON w.material_id = m.id
                LEFT JOIN colors c ON w.color_id = c.id
                LEFT JOIN sections s ON m.section_id = s.id
                WHERE w.quantity > 0
                ORDER BY m.name, c.name
            """)
            
            items = cursor.fetchall()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'items': [dict(item) for item in items]}, ensure_ascii=False)
            }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')
            
            if action == 'write_off_defect':
                warehouse_id = body.get('warehouse_id')
                quantity = body.get('quantity', 0)
                reason = body.get('reason', '')
                user_id = event.get('headers', {}).get('X-User-Id')
                
                cursor.execute("SELECT * FROM warehouse WHERE id = %s", (warehouse_id,))
                warehouse_item = cursor.fetchone()
                
                if not warehouse_item:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Элемент склада не найден'})
                    }
                
                if warehouse_item['quantity'] < quantity:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Недостаточно материала на складе'})
                    }
                
                cursor.execute(
                    "INSERT INTO defects (material_id, color_id, quantity, unit, reason, created_by) VALUES (%s, %s, %s, %s, %s, %s)",
                    (warehouse_item['material_id'], warehouse_item['color_id'], quantity, warehouse_item['unit'], reason, user_id)
                )
                
                cursor.execute(
                    "UPDATE warehouse SET quantity = quantity - %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s",
                    (quantity, warehouse_id)
                )
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'message': 'Материал списан в брак'}, ensure_ascii=False)
                }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Метод не поддерживается'})
        }
    
    finally:
        cursor.close()
        conn.close()
