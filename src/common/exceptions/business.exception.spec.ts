import { BusinessException } from './business.exception';
import { ErrorCode } from '../constants/error-codes';

describe('BusinessException', () => {
  describe('constructor', () => {
    it('should create an exception with error code and message', () => {
      const exception = new BusinessException(
        ErrorCode.USER_NOT_FOUND,
        'User not found',
      );

      expect(exception.errorCode).toBe(ErrorCode.USER_NOT_FOUND);
      expect(exception.message).toBe('User not found');
    });

    it('should use default message if not provided', () => {
      const exception = new BusinessException(ErrorCode.USER_NOT_FOUND);
      expect(exception.message).toContain('User not found');
    });

    it('should include data and errors if provided', () => {
      const data = { userId: 123 };
      const errors = ['Error 1', 'Error 2'];
      const exception = new BusinessException(
        ErrorCode.VALIDATION_ERROR,
        'Validation failed',
        data,
        errors,
      );

      expect(exception.data).toEqual(data);
      expect(exception.errors).toEqual(errors);
    });
  });

  describe('static methods', () => {
    describe('validation', () => {
      it('should create a validation exception', () => {
        const errors = ['Field1 is required', 'Field2 is invalid'];
        const exception = BusinessException.validation(
          'Validation failed',
          errors,
        );

        expect(exception.errorCode).toBe(ErrorCode.VALIDATION_ERROR);
        expect(exception.message).toBe('Validation failed');
        expect(exception.errors).toEqual(errors);
      });

      it('should use default message if not provided', () => {
        const exception = BusinessException.validation();
        expect(exception.message).toBe('Validation failed');
      });
    });

    describe('unauthorized', () => {
      it('should create an unauthorized exception', () => {
        const exception = BusinessException.unauthorized('Token expired');
        expect(exception.errorCode).toBe(ErrorCode.UNAUTHORIZED);
        expect(exception.message).toBe('Token expired');
      });

      it('should use default message if not provided', () => {
        const exception = BusinessException.unauthorized();
        expect(exception.message).toBe('Authentication required');
      });
    });

    describe('forbidden', () => {
      it('should create a forbidden exception', () => {
        const exception = BusinessException.forbidden('Access denied');
        expect(exception.errorCode).toBe(ErrorCode.PERMISSION_DENIED);
        expect(exception.message).toBe('Access denied');
      });

      it('should use default message if not provided', () => {
        const exception = BusinessException.forbidden();
        expect(exception.message).toBe('Permission denied');
      });
    });

    describe('notFound', () => {
      it('should create a not found exception with id', () => {
        const exception = BusinessException.notFound('User', 123);
        expect(exception.errorCode).toBe(ErrorCode.RESOURCE_NOT_FOUND);
        expect(exception.message).toBe('User with id 123 not found');
      });

      it('should create a not found exception without id', () => {
        const exception = BusinessException.notFound('User');
        expect(exception.message).toBe('User not found');
      });

      it('should use default resource name', () => {
        const exception = BusinessException.notFound();
        expect(exception.message).toBe('Resource not found');
      });
    });

    describe('duplicate', () => {
      it('should create a duplicate exception with field', () => {
        const exception = BusinessException.duplicate('User', 'email');
        expect(exception.errorCode).toBe(ErrorCode.RESOURCE_ALREADY_EXISTS);
        expect(exception.message).toBe('User with this email already exists');
      });

      it('should create a duplicate exception without field', () => {
        const exception = BusinessException.duplicate('User');
        expect(exception.message).toBe('User already exists');
      });

      it('should use default resource name', () => {
        const exception = BusinessException.duplicate();
        expect(exception.message).toBe('Resource already exists');
      });
    });

    describe('invalidParameter', () => {
      it('should create an invalid parameter exception with reason', () => {
        const exception = BusinessException.invalidParameter(
          'age',
          'must be positive',
        );
        expect(exception.errorCode).toBe(ErrorCode.INVALID_PARAMETER);
        expect(exception.message).toBe(
          'Invalid parameter: age - must be positive',
        );
      });

      it('should create an invalid parameter exception without reason', () => {
        const exception = BusinessException.invalidParameter('age');
        expect(exception.message).toBe('Invalid parameter: age');
      });

      it('should use default message if parameter not provided', () => {
        const exception = BusinessException.invalidParameter();
        expect(exception.message).toBe('Invalid parameter');
      });
    });

    describe('missingParameter', () => {
      it('should create a missing parameter exception', () => {
        const exception = BusinessException.missingParameter('email');
        expect(exception.errorCode).toBe(ErrorCode.MISSING_PARAMETER);
        expect(exception.message).toBe('Missing required parameter: email');
      });
    });

    describe('operationNotAllowed', () => {
      it('should create an operation not allowed exception with operation', () => {
        const exception = BusinessException.operationNotAllowed('delete user');
        expect(exception.errorCode).toBe(ErrorCode.OPERATION_NOT_ALLOWED);
        expect(exception.message).toBe('Operation not allowed: delete user');
      });

      it('should use default message if operation not provided', () => {
        const exception = BusinessException.operationNotAllowed();
        expect(exception.message).toBe('Operation not allowed');
      });
    });

    describe('thirdPartyError', () => {
      it('should create a third party error exception', () => {
        const details = { error: 'Connection timeout' };
        const exception = BusinessException.thirdPartyError(
          'Payment Gateway',
          details,
        );
        expect(exception.errorCode).toBe(ErrorCode.THIRD_PARTY_ERROR);
        expect(exception.message).toBe('Payment Gateway service error');
        expect(exception.data).toEqual(details);
      });

      it('should use default message if service not provided', () => {
        const exception = BusinessException.thirdPartyError();
        expect(exception.message).toBe('Third-party service error');
      });
    });

    describe('databaseError', () => {
      it('should create a database error exception', () => {
        const details = { query: 'SELECT * FROM users' };
        const exception = BusinessException.databaseError('query', details);
        expect(exception.errorCode).toBe(ErrorCode.DATABASE_ERROR);
        expect(exception.message).toBe('Database query failed');
        expect(exception.data).toEqual(details);
      });

      it('should use default message if operation not provided', () => {
        const exception = BusinessException.databaseError();
        expect(exception.message).toBe('Database operation failed');
      });
    });
  });
});
