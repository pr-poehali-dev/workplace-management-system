'''
Business: Управление разделами/категориями материалов
Args: event с httpMethod (GET/POST/PUT/DELETE), body для создания/обновления
Returns: HTTP response с данными разделов или статусом операции
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
                    SELECT s.id, s.name, s.created_at, 
                           COUNT(m.id) as material_count
                    FROM t_p61217265_workplace_management.categories s
                    LEFT JOIN t_p61217265_workplace_management.materials m ON s.id = m.category_id
                    GROUP BY s.id, s.name, s.created_at
                    ORDER BY s.name
                ''')
                sections = cur.fetchall()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps([dict(s) for s in sections], default=str)
                }
            
            elif method == 'POST':
                data = json.loads(event.get('body', '{}'))
                cur.execute('''
                    INSERT INTO t_p61217265_workplace_management.categories (name)
                    VALUES (%s)
                    RETURNING id, name
                ''', (data['name'],))
                section = cur.fetchone()
                conn.commit()
                return {
                    'statusCode': 201,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(dict(section), default=str)
                }
            
            elif method == 'PUT':
                data = json.loads(event.get('body', '{}'))
                params = event.get('queryStringParameters', {})
                section_id = params.get('id')
                
                cur.execute('''
                    UPDATE t_p61217265_workplace_management.categories 
                    SET name = %s
                    WHERE id = %s
                    RETURNING id, name
                ''', (data['name'], section_id))
                section = cur.fetchone()
                conn.commit()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(dict(section) if section else {}, default=str)
                }
            
            elif method == 'DELETE':
                params = event.get('queryStringParameters', {})
                section_id = params.get('id')
                
                cur.execute('SELECT COUNT(*) as cnt FROM t_p61217265_workplace_management.materials WHERE category_id = %s', (section_id,))
                result = cur.fetchone()
                if result['cnt'] > 0:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Cannot delete section with materials'})
                    }
                
                cur.execute('DELETE FROM t_p61217265_workplace_management.categories WHERE id = %s', (section_id,))
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