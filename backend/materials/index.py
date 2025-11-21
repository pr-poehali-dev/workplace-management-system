import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Управление материалами с привязкой к разделам и цветам
    Args: event с httpMethod, body для создания/редактирования материалов
    Returns: HTTP response с данными материалов
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
            section_id = params.get('section_id')
            
            if section_id:
                cursor.execute("""
                    SELECT m.*, c.name as color_name, s.name as section_name 
                    FROM materials m
                    LEFT JOIN colors c ON m.color_id = c.id
                    LEFT JOIN sections s ON m.section_id = s.id
                    WHERE m.section_id = %s
                    ORDER BY m.name
                """, (section_id,))
            else:
                cursor.execute("""
                    SELECT m.*, c.name as color_name, s.name as section_name 
                    FROM materials m
                    LEFT JOIN colors c ON m.color_id = c.id
                    LEFT JOIN sections s ON m.section_id = s.id
                    ORDER BY m.name
                """)
            
            materials = cursor.fetchall()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'materials': [dict(m) for m in materials]}, ensure_ascii=False)
            }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            name = body.get('name')
            color_id = body.get('color_id')
            section_id = body.get('section_id')
            
            cursor.execute(
                "INSERT INTO materials (name, color_id, section_id) VALUES (%s, %s, %s) RETURNING id, name, color_id, section_id",
                (name, color_id, section_id)
            )
            material = cursor.fetchone()
            conn.commit()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'material': dict(material)}, ensure_ascii=False)
            }
        
        elif method == 'PUT':
            body = json.loads(event.get('body', '{}'))
            material_id = body.get('id')
            
            updates = []
            params = []
            
            if 'name' in body:
                updates.append('name = %s')
                params.append(body['name'])
            if 'color_id' in body:
                updates.append('color_id = %s')
                params.append(body['color_id'])
            if 'section_id' in body:
                updates.append('section_id = %s')
                params.append(body['section_id'])
            
            params.append(material_id)
            
            cursor.execute(
                f"UPDATE materials SET {', '.join(updates)}, updated_at = CURRENT_TIMESTAMP WHERE id = %s RETURNING id, name, color_id, section_id",
                params
            )
            material = cursor.fetchone()
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'material': dict(material)}, ensure_ascii=False)
            }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Метод не поддерживается'})
        }
    
    finally:
        cursor.close()
        conn.close()
