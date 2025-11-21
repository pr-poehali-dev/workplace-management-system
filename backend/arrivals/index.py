import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Управление приходом материалов с автоматическим добавлением на склад
    Args: event с httpMethod, body для регистрации прихода
    Returns: HTTP response с данными прихода
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
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
                SELECT a.*, m.name as material_name, c.name as color_name, u.full_name as created_by_name
                FROM arrivals a
                JOIN materials m ON a.material_id = m.id
                LEFT JOIN colors c ON a.color_id = c.id
                LEFT JOIN users u ON a.created_by = u.id
                ORDER BY a.created_at DESC
            """)
            
            arrivals = cursor.fetchall()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'arrivals': [dict(a) for a in arrivals]}, ensure_ascii=False)
            }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            items = body.get('items', [])
            user_id = event.get('headers', {}).get('X-User-Id')
            
            for item in items:
                material_id = item.get('material_id')
                color_id = item.get('color_id')
                quantity = item.get('quantity', 0)
                unit = item.get('unit', 'шт')
                
                cursor.execute(
                    "INSERT INTO arrivals (material_id, color_id, quantity, unit, created_by) VALUES (%s, %s, %s, %s, %s)",
                    (material_id, color_id, quantity, unit, user_id)
                )
                
                cursor.execute(
                    "SELECT * FROM warehouse WHERE material_id = %s AND (color_id = %s OR (color_id IS NULL AND %s IS NULL))",
                    (material_id, color_id, color_id)
                )
                existing = cursor.fetchone()
                
                if existing:
                    cursor.execute(
                        "UPDATE warehouse SET quantity = quantity + %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s",
                        (quantity, existing['id'])
                    )
                else:
                    cursor.execute(
                        "INSERT INTO warehouse (material_id, color_id, quantity, unit) VALUES (%s, %s, %s, %s)",
                        (material_id, color_id, quantity, unit)
                    )
            
            conn.commit()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'message': 'Приход зарегистрирован'}, ensure_ascii=False)
            }
        
        elif method == 'PUT':
            body = json.loads(event.get('body', '{}'))
            arrival_id = body.get('id')
            
            cursor.execute("SELECT * FROM arrivals WHERE id = %s", (arrival_id,))
            old_arrival = cursor.fetchone()
            
            if not old_arrival:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Приход не найден'})
                }
            
            cursor.execute(
                "SELECT * FROM warehouse WHERE material_id = %s AND (color_id = %s OR (color_id IS NULL AND %s IS NULL))",
                (old_arrival['material_id'], old_arrival['color_id'], old_arrival['color_id'])
            )
            warehouse_item = cursor.fetchone()
            
            if warehouse_item:
                cursor.execute(
                    "UPDATE warehouse SET quantity = quantity - %s WHERE id = %s",
                    (old_arrival['quantity'], warehouse_item['id'])
                )
            
            updates = []
            params = []
            
            if 'quantity' in body:
                updates.append('quantity = %s')
                params.append(body['quantity'])
            
            params.append(arrival_id)
            
            cursor.execute(
                f"UPDATE arrivals SET {', '.join(updates)} WHERE id = %s RETURNING *",
                params
            )
            updated_arrival = cursor.fetchone()
            
            cursor.execute(
                "SELECT * FROM warehouse WHERE material_id = %s AND (color_id = %s OR (color_id IS NULL AND %s IS NULL))",
                (updated_arrival['material_id'], updated_arrival['color_id'], updated_arrival['color_id'])
            )
            warehouse_item = cursor.fetchone()
            
            if warehouse_item:
                cursor.execute(
                    "UPDATE warehouse SET quantity = quantity + %s WHERE id = %s",
                    (updated_arrival['quantity'], warehouse_item['id'])
                )
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'arrival': dict(updated_arrival)}, ensure_ascii=False)
            }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Метод не поддерживается'})
        }
    
    finally:
        cursor.close()
        conn.close()
