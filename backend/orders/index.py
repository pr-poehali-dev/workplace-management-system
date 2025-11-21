import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Управление заявками со статусами (новая, выполняется, готово)
    Args: event с httpMethod, body для создания/обновления заявок
    Returns: HTTP response с данными заявок
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
            params = event.get('queryStringParameters', {})
            status = params.get('status')
            
            if status:
                cursor.execute("""
                    SELECT o.*, m.name as material_name, c.name as color_name, u.full_name as created_by_name
                    FROM orders o
                    JOIN materials m ON o.material_id = m.id
                    LEFT JOIN colors c ON o.color_id = c.id
                    LEFT JOIN users u ON o.created_by = u.id
                    WHERE o.status = %s
                    ORDER BY o.created_at DESC
                """, (status,))
            else:
                cursor.execute("""
                    SELECT o.*, m.name as material_name, c.name as color_name, u.full_name as created_by_name
                    FROM orders o
                    JOIN materials m ON o.material_id = m.id
                    LEFT JOIN colors c ON o.color_id = c.id
                    LEFT JOIN users u ON o.created_by = u.id
                    ORDER BY o.created_at DESC
                """)
            
            orders = cursor.fetchall()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'orders': [dict(o) for o in orders]}, ensure_ascii=False)
            }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            material_id = body.get('material_id')
            size = body.get('size')
            color_id = body.get('color_id')
            quantity_requested = body.get('quantity_requested')
            unit = body.get('unit', 'шт')
            user_id = event.get('headers', {}).get('X-User-Id')
            
            cursor.execute(
                "INSERT INTO orders (material_id, size, color_id, quantity_requested, unit, created_by) VALUES (%s, %s, %s, %s, %s, %s) RETURNING id, status",
                (material_id, size, color_id, quantity_requested, unit, user_id)
            )
            order = cursor.fetchone()
            conn.commit()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'order': dict(order)}, ensure_ascii=False)
            }
        
        elif method == 'PUT':
            body = json.loads(event.get('body', '{}'))
            order_id = body.get('id')
            
            cursor.execute("SELECT * FROM orders WHERE id = %s", (order_id,))
            order = cursor.fetchone()
            
            if not order:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Заявка не найдена'})
                }
            
            updates = []
            params = []
            
            if 'quantity_completed' in body:
                quantity_completed = body['quantity_completed']
                updates.append('quantity_completed = %s')
                params.append(quantity_completed)
                
                if quantity_completed > 0 and order['status'] == 'new':
                    updates.append("status = 'in_progress'")
                elif quantity_completed >= order['quantity_requested']:
                    updates.append("status = 'completed'")
            
            if 'size' in body:
                updates.append('size = %s')
                params.append(body['size'])
            
            if 'quantity_requested' in body:
                updates.append('quantity_requested = %s')
                params.append(body['quantity_requested'])
            
            params.append(order_id)
            
            cursor.execute(
                f"UPDATE orders SET {', '.join(updates)}, updated_at = CURRENT_TIMESTAMP WHERE id = %s RETURNING *",
                params
            )
            updated_order = cursor.fetchone()
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'order': dict(updated_order)}, ensure_ascii=False)
            }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Метод не поддерживается'})
        }
    
    finally:
        cursor.close()
        conn.close()
