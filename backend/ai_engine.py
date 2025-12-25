from google import genai
import os
from functools import lru_cache
from file_handler import get_dynamic_schema

# Cache for schema - avoids repeated database calls
@lru_cache(maxsize=50)
def get_cached_schema(table_name: str) -> str:
    """
    Get schema with caching.
    Cache remains valid until explicitly cleared.
    """
    return get_dynamic_schema(table_name)

def clear_schema_cache():
    """Clear schema cache - call when schema changes"""
    get_cached_schema.cache_clear()

class AIEngine:
    """Google Gemini API powered AI engine - Dynamic schema support"""

    def __init__(self, table_name: str = None):
        """
        Initialize AI engine
        
        Args:
            table_name: Table name to analyze (None for all tables)
        """
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable not found!")

        self.client = genai.Client(api_key=api_key)
        self.model_name = 'gemini-2.0-flash'
        self.table_name = table_name
        # Use cached schema for better performance
        self.db_schema = get_cached_schema(table_name or "__all__")

    def generate_sql(self, user_question: str) -> str:
        """
        Convert user question to SQL query

        Args:
            user_question: User's natural language question

        Returns:
            SQL query as string
        """
        prompt = f"""You are an SQL expert. Convert the user's question to an SQL query.

DATABASE SCHEMA:
{self.db_schema}

RULES:
- ONLY produce SQL query, do not write anything else
- Do not add comments or explanations
- Return SELECT 'INSUFFICIENT_DATA' as error; if there is not enough information in the schema
- NEVER use dangerous commands (DROP, DELETE, UPDATE, INSERT, ALTER, CREATE)
- Use column names EXACTLY as they appear in the schema
- Get table name from schema and use it EXACTLY
- Use SUM() for total calculations
- Use AVG() for averages
- Use GROUP BY for category/group based data
- Use ORDER BY for sorting
- Only write SELECT queries
- Use SQLite syntax

IMPORTANT: Look at the sample data in the schema to understand data types and values.

USER QUESTION:
{user_question}

SQL QUERY:"""

        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt
            )
            sql_query = response.text.strip()

            # Security check - block dangerous commands
            dangerous_keywords = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'CREATE', 'TRUNCATE', 'EXEC']
            sql_upper = sql_query.upper()

            for keyword in dangerous_keywords:
                if keyword in sql_upper:
                    print(f"⚠️  Dangerous command detected: {keyword}")
                    return None

            # Clean markdown code blocks - all variations
            import re
            # Clean ```sql, ```sqlite, ```SQL etc. formats
            sql_query = re.sub(r'```\w*\s*', '', sql_query)
            sql_query = sql_query.replace('```', '').strip()
            
            # Remove everything before SELECT (AI sometimes adds preamble)
            select_match = re.search(r'\bSELECT\b', sql_query, re.IGNORECASE)
            if select_match:
                sql_query = sql_query[select_match.start():]
            
            # Clean line breaks and extra spaces
            sql_query = ' '.join(sql_query.split())

            # Add semicolon if missing
            if not sql_query.endswith(';'):
                sql_query += ';'

            print(f"✅ SQL generated: {sql_query[:100]}...")
            return sql_query

        except Exception as e:
            print(f"❌ SQL generation error: {str(e)}")
            return None

    def explain_results(self, question: str, query: str, results: list, kpis: dict) -> str:
        """
        Explain analysis results in English

        Args:
            question: User's question
            query: Executed SQL query
            results: Query results (first 5 rows)
            kpis: Calculated KPIs

        Returns:
            English explanation text
        """
        # Convert results to string (truncate if too long)
        results_str = str(results[:5]) if len(results) > 5 else str(results)
        if len(results_str) > 500:
            results_str = results_str[:500] + "..."

        prompt = f"""You are a data analyst. Explain the results clearly.

USER QUESTION: {question}

SQL QUERY: {query}

RESULTS: {results_str}

KPIs: {kpis}

YOUR TASK:
- Provide a clear, understandable, and business-focused explanation in English
- Highlight and emphasize the numbers
- Provide statistical insights
- Use short and clear sentences (maximum 3-4 sentences)
- Mention trends and insights
- Do not use emojis, only plain text
- Translate column names to natural English

NOW EXPLAIN:"""

        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt
            )
            explanation = response.text.strip()

            # Clean emojis if any
            explanation = explanation.replace('📊', '').replace('📈', '').replace('💰', '').replace('✅', '').replace('🎯', '')

            print(f"✅ Explanation generated: {explanation[:100]}...")
            return explanation

        except Exception as e:
            print(f"❌ Explanation generation error: {str(e)}")
            return "Results retrieved successfully but could not generate explanation."

    def determine_chart_type(self, data: list, sql_query: str) -> dict:
        """
        Automatically determine chart type based on data

        Args:
            data: Query results
            sql_query: SQL query

        Returns:
            Chart configuration dict
        """
        if not data or len(data) == 0:
            return None

        # Check columns in first row
        first_row = data[0]
        columns = list(first_row.keys())
        
        # Find column types
        numeric_cols = []
        string_cols = []
        date_cols = []
        
        for col in columns:
            value = first_row[col]
            col_lower = col.lower()
            
            if 'date' in col_lower or 'tarih' in col_lower or 'time' in col_lower:
                date_cols.append(col)
            elif isinstance(value, (int, float)):
                numeric_cols.append(col)
            else:
                string_cols.append(col)

        # If date column exists -> Line Chart
        if date_cols:
            y_col = numeric_cols[0] if numeric_cols else columns[-1]
            return {
                "type": "line",
                "x_axis": date_cols[0],
                "y_axis": y_col
            }

        # If few rows and categorical data -> Pie Chart
        if len(data) <= 6 and string_cols and numeric_cols:
            return {
                "type": "pie",
                "x_axis": string_cols[0],
                "y_axis": numeric_cols[0]
            }

        # If categorical and numeric data -> Bar Chart
        if string_cols and numeric_cols:
            return {
                "type": "bar",
                "x_axis": string_cols[0],
                "y_axis": numeric_cols[0]
            }

        # Default: Bar chart with first and last column
        return {
            "type": "bar",
            "x_axis": columns[0],
            "y_axis": columns[-1] if len(columns) > 1 else columns[0]
        }
