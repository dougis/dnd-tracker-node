import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';

describe('SSE Utility Functions', () => {
  let mockResponse: any;

  beforeEach(() => {
    mockResponse = {
      write: vi.fn(),
      end: vi.fn(),
      setHeader: vi.fn()
    };
  });

  describe('sanitizeForSSE', () => {
    // Need to import the function dynamically since it's internal
    let sanitizeForSSE: any;

    beforeAll(async () => {
      const routesModule = await import('./routes');
      sanitizeForSSE = routesModule.sanitizeForSSE;
    });

    it('should sanitize string values to prevent XSS', () => {
      const input = '<script>alert("xss")</script>';
      const result = sanitizeForSSE(input);
      expect(result).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    });

    it('should sanitize HTML entities in strings', () => {
      const input = 'Test & "quotes" \'apostrophes\' <tags>';
      const result = sanitizeForSSE(input);
      expect(result).toBe('Test &amp; &quot;quotes&quot; &#x27;apostrophes&#x27; &lt;tags&gt;');
    });

    it('should recursively sanitize arrays', () => {
      const input = ['<script>', 'normal text', '<img src=x>'];
      const result = sanitizeForSSE(input);
      expect(result).toEqual(['&lt;script&gt;', 'normal text', '&lt;img src=x&gt;']);
    });

    it('should recursively sanitize object properties', () => {
      const input = {
        name: '<script>alert("test")</script>',
        description: 'Safe text',
        nested: {
          value: '"quoted" & <dangerous>'
        }
      };
      const result = sanitizeForSSE(input);
      expect(result).toEqual({
        name: '&lt;script&gt;alert(&quot;test&quot;)&lt;/script&gt;',
        description: 'Safe text',
        nested: {
          value: '&quot;quoted&quot; &amp; &lt;dangerous&gt;'
        }
      });
    });

    it('should handle primitive values safely', () => {
      expect(sanitizeForSSE(123)).toBe(123);
      expect(sanitizeForSSE(true)).toBe(true);
      expect(sanitizeForSSE(null)).toBe(null);
      expect(sanitizeForSSE(undefined)).toBe(undefined);
    });

    it('should handle empty arrays and objects', () => {
      expect(sanitizeForSSE([])).toEqual([]);
      expect(sanitizeForSSE({})).toEqual({});
    });

    it('should handle complex nested structures', () => {
      const input = {
        participants: [
          { name: '<script>test</script>', hp: 100 },
          { name: 'Safe Name', hp: 75 }
        ],
        encounter: {
          name: '"Dangerous" & <evil>',
          description: 'A test encounter'
        }
      };
      const result = sanitizeForSSE(input);
      expect(result).toEqual({
        participants: [
          { name: '&lt;script&gt;test&lt;/script&gt;', hp: 100 },
          { name: 'Safe Name', hp: 75 }
        ],
        encounter: {
          name: '&quot;Dangerous&quot; &amp; &lt;evil&gt;',
          description: 'A test encounter'
        }
      });
    });
  });

  describe('writeSSEData', () => {
    let writeSSEData: any;

    beforeAll(async () => {
      const routesModule = await import('./routes');
      writeSSEData = routesModule.writeSSEData;
    });

    it('should write properly formatted SSE data', () => {
      const testData = { type: 'test', message: 'hello' };
      writeSSEData(mockResponse, testData);
      
      expect(mockResponse.write).toHaveBeenCalledWith(
        'data: {"type":"test","message":"hello"}\n\n',
        'utf8'
      );
    });

    it('should sanitize data before writing', () => {
      const testData = { message: '<script>alert("xss")</script>' };
      writeSSEData(mockResponse, testData);
      
      expect(mockResponse.write).toHaveBeenCalledWith(
        'data: {"message":"&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;"}\n\n',
        'utf8'
      );
    });

    it('should handle arrays in data', () => {
      const testData = { items: ['<test>', 'safe'] };
      writeSSEData(mockResponse, testData);
      
      expect(mockResponse.write).toHaveBeenCalledWith(
        'data: {"items":["&lt;test&gt;","safe"]}\n\n',
        'utf8'
      );
    });

    it('should throw error for non-serializable data', () => {
      const circularData: any = {};
      circularData.self = circularData;
      
      expect(() => {
        writeSSEData(mockResponse, circularData);
      }).toThrow(); // Just expect it to throw, the exact message may vary
    });

    it('should handle null and undefined data', () => {
      writeSSEData(mockResponse, null);
      expect(mockResponse.write).toHaveBeenCalledWith('data: null\n\n', 'utf8');
      
      mockResponse.write.mockClear();
      
      writeSSEData(mockResponse, undefined);
      expect(mockResponse.write).toHaveBeenCalledWith('data: null\n\n', 'utf8');
    });

    it('should handle empty objects and arrays', () => {
      writeSSEData(mockResponse, {});
      expect(mockResponse.write).toHaveBeenCalledWith('data: {}\n\n', 'utf8');
      
      mockResponse.write.mockClear();
      
      writeSSEData(mockResponse, []);
      expect(mockResponse.write).toHaveBeenCalledWith('data: []\n\n', 'utf8');
    });
  });
});