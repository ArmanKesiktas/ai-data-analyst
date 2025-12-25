"""
AI Dashboard Builder - Creates dashboards based on user requests
"""
from google import genai
import os
import json
import re
from file_handler import get_dynamic_schema, get_table_preview

class DashboardBuilder:
    """AI-powered dashboard builder"""

    def __init__(self, table_name: str = None):
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found!")

        self.client = genai.Client(api_key=api_key)
        self.model_name = 'gemini-2.0-flash'
        self.table_name = table_name
        self.db_schema = get_dynamic_schema(table_name)
        
        print(f"🔧 DashboardBuilder initialized:")
        print(f"   📋 Table: {self.table_name}")
        print(f"   📊 Schema: {self.db_schema[:200]}...")
        
        # Get sample data
        try:
            self.sample_data = get_table_preview(table_name, limit=5) if table_name else []
            print(f"   📝 Sample data: {len(self.sample_data)} rows")
        except Exception as e:
            print(f"   ❌ Sample data error: {str(e)}")
            self.sample_data = []

    def _analyze_columns(self) -> dict:
        """Analyze table columns - for filter creation"""
        from sqlalchemy import create_engine, text, inspect
        import os
        
        column_info = {
            "date_columns": [],
            "categorical_columns": [],
            "numeric_columns": [],
            "text_columns": []
        }
        
        if not self.table_name:
            return column_info
        
        DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./sales.db")
        engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})
        
        try:
            inspector = inspect(engine)
            columns = inspector.get_columns(self.table_name)
            
            with engine.connect() as conn:
                for col in columns:
                    col_name = col['name']
                    col_type = str(col['type']).upper()
                    
                    # Check unique value count
                    result = conn.execute(text(f"SELECT COUNT(DISTINCT {col_name}) FROM {self.table_name}"))
                    unique_count = result.scalar()
                    
                    # Sample values
                    sample_result = conn.execute(text(f"SELECT DISTINCT {col_name} FROM {self.table_name} LIMIT 10"))
                    sample_values = [str(row[0]) for row in sample_result.fetchall() if row[0] is not None]
                    
                    if 'DATE' in col_type or 'TIME' in col_type or any(kw in col_name.lower() for kw in ['date', 'time', 'tarih', 'zaman']):
                        column_info["date_columns"].append({
                            "name": col_name,
                            "type": "date"
                        })
                    elif 'INT' in col_type or 'REAL' in col_type or 'FLOAT' in col_type or 'NUMERIC' in col_type:
                        column_info["numeric_columns"].append({
                            "name": col_name,
                            "type": "numeric"
                        })
                    elif unique_count <= 20:
                        # Few unique values = categorical
                        column_info["categorical_columns"].append({
                            "name": col_name,
                            "unique_count": unique_count,
                            "sample_values": sample_values[:5]
                        })
                    else:
                        column_info["text_columns"].append({
                            "name": col_name,
                            "unique_count": unique_count
                        })
        except Exception as e:
            print(f"Column analysis error: {str(e)}")
        
        return column_info

    def generate_dashboard(self, user_request: str) -> dict:
        """
        Create dashboard configuration based on user request
        
        Args:
            user_request: User's dashboard description
            Example: "Daily sales trend, pie chart by categories, 
                    monthly comparison and date filter"
        
        Returns:
            Dashboard configuration (widgets, filters, layout)
        """
        
        # Analyze column types
        column_types = self._analyze_columns()
        
        prompt = f"""You are a data analyst and dashboard designer. 
Create the dashboard as requested by the user.

DATABASE SCHEMA:
{self.db_schema}

COLUMN ANALYSIS:
{json.dumps(column_types, ensure_ascii=False)}

SAMPLE DATA:
{json.dumps(self.sample_data[:3], ensure_ascii=False, default=str)}

USER REQUEST:
{user_request}

YOUR TASK:
1. Create widgets for the dashboard as requested by the user
2. CREATE SMART, TABLE-SPECIFIC FILTERS based on the actual data columns:
   - For date/time columns: use date_range filter
   - For categorical columns with few unique values (e.g., category, status, type, region): use select filter
   - For columns with many unique values that users might want to filter: use multi_select filter
   
IMPORTANT FILTER RULES:
- ONLY create filters for columns that make sense for filtering (categories, dates, status fields)
- DO NOT create filters for ID columns, numeric measurement columns, or metadata columns
- Filter labels should be user-friendly and describe what the filter does (e.g., "Category", "Date Range", "Product Type")
- Include 2-4 useful filters maximum, not every column needs a filter
- Look at the sample data to understand what columns are good filter candidates

EXAMPLES OF GOOD FILTERS:
- For a sales table: "Order Date", "Category", "Region", "Product Type"
- For an aircraft table: "Manufacturer", "Aircraft Type", "Engine Type"
- For a plants table: "Climate Zone", "Region", "Species Family"

WIDGET TYPES:
- kpi: Single numeric value display (total, average, etc.)
- bar_chart: Bar chart (category-based comparison)
- line_chart: Line chart (time series, trend)
- pie_chart: Pie chart (distribution, percentage)
- area_chart: Area chart (trend)
- table: Data table

FILTER TYPES:
- date_range: Date range picker (for date columns)
- select: Dropdown selector (for categorical columns with few options)
- multi_select: Multi-select (for columns with more options)

WIDGET SIZES (in grid system):
- small: 1 column width
- medium: 2 columns width  
- large: 2 columns width, 2 rows height
- full: 4 columns width (full row)

OUTPUT FORMAT (JSON only, do not write anything else):
{{
  "title": "Dashboard title",
  "description": "Brief description",
  "filters": [
    {{
      "id": "filter_1",
      "type": "date_range|select|multi_select",
      "label": "Filter label",
      "column": "column_name",
      "options": ["value1", "value2"] // for select/multi_select
    }}
  ],
  "widgets": [
    {{
      "id": "widget_1",
      "title": "Widget title",
      "type": "kpi|bar_chart|line_chart|pie_chart|area_chart|table",
      "size": "small|medium|large|full",
      "sql": "SELECT ... FROM {self.table_name} (in SQLite format)",
      "x_axis": "x axis column (for charts)",
      "y_axis": "y axis column (for charts)",
      "color": "blue|green|purple|orange",
      "gridPosition": {{"x": 0, "y": 0, "w": 2, "h": 1}}
    }}
  ],
  "layout": "grid"
}}

RULES:
1. Use only SELECT in SQL queries
2. Table name: {self.table_name}
3. Use SQLite syntax
4. Write realistic SQL queries for each widget
5. Return only JSON, do not add explanation
6. Include EVERY element the user requested
7. Automatically create filters based on table columns
8. Use gridPosition to place widgets logically (x: 0-3, y: 0+, w: 1-4, h: 1-2)
9. ALL titles, labels, and descriptions MUST be in English

JSON:"""

        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt
            )
            
            result_text = response.text.strip()
            
            # Parse JSON
            # Clean markdown blocks
            result_text = re.sub(r'```json\s*', '', result_text)
            result_text = re.sub(r'```\s*', '', result_text)
            result_text = result_text.strip()
            
            # JSON parse
            dashboard_config = json.loads(result_text)
            
            # Validate and clean SQL for each widget
            for widget in dashboard_config.get('widgets', []):
                sql = widget.get('sql', '')
                # Remove everything before SELECT
                select_match = re.search(r'\bSELECT\b', sql, re.IGNORECASE)
                if select_match:
                    sql = sql[select_match.start():]
                # Add semicolon
                if not sql.endswith(';'):
                    sql += ';'
                widget['sql'] = sql
            
            print(f"✅ Dashboard created: {dashboard_config.get('title', 'Untitled')}")
            print(f"   - {len(dashboard_config.get('widgets', []))} widgets")
            print(f"   - {len(dashboard_config.get('filters', []))} filters")
            
            return dashboard_config
            
        except json.JSONDecodeError as e:
            print(f"❌ JSON parse error: {str(e)}")
            print(f"   Raw response: {result_text[:200]}...")
            return {
                "error": "Could not create dashboard. Please describe more clearly.",
                "title": "Error",
                "widgets": [],
                "filters": []
            }
        except Exception as e:
            print(f"❌ Dashboard creation error: {str(e)}")
            return {
                "error": str(e),
                "title": "Error",
                "widgets": [],
                "filters": []
            }

    def execute_widget_query(self, sql: str) -> list:
        """Execute SQL query for widget"""
        from query_executor import QueryExecutor
        import re
        
        try:
            # Clean SQL
            sql = sql.strip()
            
            # Clean markdown blocks
            sql = re.sub(r'```(?:sql|sqlite)?\s*', '', sql)
            sql = re.sub(r'```\s*', '', sql)
            
            # Remove everything before SELECT
            select_match = re.search(r'\bSELECT\b', sql, re.IGNORECASE)
            if select_match:
                sql = sql[select_match.start():]
            
            # Remove everything after semicolon
            if ';' in sql:
                sql = sql[:sql.index(';') + 1]
            else:
                sql += ';'
            
            print(f"📊 Widget query: {sql[:100]}...")
            
            with QueryExecutor() as executor:
                df = executor.execute_query(sql)
                result = df.to_dict('records')
                print(f"   ✅ {len(result)} rows returned")
                return result
                
        except Exception as e:
            print(f"❌ Widget query error: {str(e)}")
            print(f"   SQL: {sql[:200]}")
            return []

