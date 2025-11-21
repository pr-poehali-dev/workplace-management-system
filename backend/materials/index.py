'''
Business: Управление каталогом материалов с привязкой к разделам и цветам
Args: event с httpMethod (GET/POST/PUT/DELETE), body для создания/обновления
Returns: HTTP response с данными материалов или статусом операции
'''

import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            if method == 'GET':
                cur.execute('''
                    SELECT m.id, m.name, m.category_id, m.color_id, m.created_at, 
                           s.name as section_name, c.name as color_name
                    FROM t_p61217265_workplace_management.materials m
                    LEFT JOIN t_p61217265_workplace_management.categories s ON m.category_id = s.id
                    LEFT JOIN t_p61217265_workplace_management.colors c ON m.color_id = c.id
                    ORDER BY m.created_at DESC
                ''')
                materials = cur.fetchall()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps([dict(m) for m in materials], default=str)
                }
            
            elif method == 'POST':
                data = json.loads(event.get('body', '{}'))
                cur.execute('''
                    INSERT INTO t_p61217265_workplace_management.materials (name, category_id, color_id)
                    VALUES (%s, %s, %s)
                    RETURNING id, name, category_id, color_id
                ''', (data['name'], data.get('section_id'), data.get('color_id')))
                material = cur.fetchone()
                conn.commit()
                return {
                    'statusCode': 201,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(dict(material), default=str)
                }
            
            elif method == 'PUT':
                data = json.loads(event.get('body', '{}'))
                params = event.get('queryStringParameters', {})
                material_id = params.get('id')
                
                cur.execute('''
                    UPDATE t_p61217265_workplace_management.materials 
                    SET name = %s, category_id = %s, color_id = %s
                    WHERE id = %s
                    RETURNING id, name, category_id, color_id
                ''', (data['name'], data.get('section_id'), data.get('color_id'), material_id))
                material = cur.fetchone()
                conn.commit()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(dict(material) if material else {}, default=str)
                }
            
            elif method == 'DELETE':
                params = event.get('queryStringParameters', {})
                material_id = params.get('id')
                cur.execute('DELETE FROM t_p61217265_workplace_management.materials WHERE id = %s', (material_id,))
                conn.commit()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True})
                }
    
    finally:
        conn.close()
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'})
    }