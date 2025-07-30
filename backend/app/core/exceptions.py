from fastapi import HTTPException, status

class DatabaseException(HTTPException):
    def __init__(self, detail: str):
        super().__init__(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=detail)

class ValidationException(HTTPException):
    def __init__(self, detail: str):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)

class DataValidationError(Exception):
    """Raised when data validation fails"""
    pass

class ProcessingError(Exception):
    """Raised when data processing fails"""
    pass

class AnalyticsError(Exception):
    """Raised when analytics computation fails"""
    pass