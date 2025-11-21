import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Управление браком с возможностью утилизации
    Args: event с httpMethod, body для списания брака
    Returns: HTTP response с данными брака
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
                    SELECT d.*, m.name as material_name, c.name as color_name, u.full_name as created_by_name
                    FROM defects d
                    JOIN materials m ON d.material_id = m.id
                    LEFT JOIN colors c ON d.color_id = c.id
                    LEFT JOIN users u ON d.created_by = u.id
                    WHERE d.status = %s
                    ORDER BY d.created_at DESC
                """, (status,))
            else:
                cursor.execute("""
                    SELECT d.*, m.name as material_name, c.name as color_name, u.full_name as created_by_name
                    FROM defects d
                    JOIN materials m ON d.material_id = m.id
                    LEFT JOIN colors c ON d.color_id = c.id
                    LEFT JOIN users u ON d.created_by = u.id
                    ORDER BY d.created_at DESC
                """)
            
            defects = cursor.fetchall()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'defects': [dict(d) for d in defects]}, ensure_ascii=False)
            }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action', 'create')
            
            if action == 'dispose':
                defect_id = body.get('defect_id')
                
                cursor.execute(
                    "UPDATE defects SET status = 'disposed', disposed_at = CURRENT_TIMESTAMP WHERE id = %s RETURNING *",
                    (defect_id,)
                )
                defect = cursor.fetchone()
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'defect': dict(defect)}, ensure_ascii=False)
                }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Метод не поддерживается'})
        }
    
    finally:
        cursor.close()
        conn.close()
