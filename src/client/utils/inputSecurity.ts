/**
 * Input Security and Validation Utilities
 * 
 * Comprehensive security utilities for input validation, XSS prevention,
 * and file upload security. Part of Phase 2 security hardening.
 */

import DOMPurify from 'dompurify';

// XSS Protection Configuration
const XSS_CONFIG = {
  ALLOWED_TAGS: ['b', 'i', 'u', 'strong', 'em', 'p', 'br', 'span'] as string[],
  ALLOWED_ATTR: ['class', 'id'] as string[],
  KEEP_CONTENT: true
} as const;

/**
 * Sanitize user-generated content to prevent XSS attacks
 */
export const sanitizeUserContent = (content: string): string => {
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: XSS_CONFIG.ALLOWED_TAGS,
    ALLOWED_ATTR: XSS_CONFIG.ALLOWED_ATTR,
    KEEP_CONTENT: XSS_CONFIG.KEEP_CONTENT
  });
};

/**
 * Sanitize HTML content for display in the editor
 */
export const sanitizeEditorContent = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [...XSS_CONFIG.ALLOWED_TAGS, 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    ALLOWED_ATTR: [...XSS_CONFIG.ALLOWED_ATTR, 'style', 'data-element-id'],
    KEEP_CONTENT: true
  });
};

/**
 * File Upload Security Validation
 */
export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedName?: string;
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MALICIOUS_EXTENSIONS = ['.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar', '.py', '.php'] as const;

/**
 * Validate uploaded files for security
 */
export const validateFileUpload = (file: File): FileValidationResult => {
  // File type validation
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as typeof ALLOWED_IMAGE_TYPES[number])) {
    return {
      isValid: false,
      error: `Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed. Got: ${file.type}`
    };
  }

  // File size validation
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size exceeds 10MB limit. File size: ${(file.size / 1024 / 1024).toFixed(2)}MB`
    };
  }

  // Malicious extension check
  const fileName = file.name.toLowerCase();
  const hasMaliciousExtension = MALICIOUS_EXTENSIONS.some(ext => fileName.endsWith(ext));
  if (hasMaliciousExtension) {
    return {
      isValid: false,
      error: 'File contains potentially malicious extension'
    };
  }

  // File name sanitization
  const sanitizedName = file.name
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace non-alphanumeric chars
    .replace(/_+/g, '_') // Collapse multiple underscores
    .replace(/^_|_$/g, '') // Remove leading/trailing underscores
    .toLowerCase();

  return {
    isValid: true,
    sanitizedName
  };
};

/**
 * Create a sanitized File object
 */
export const createSanitizedFile = (originalFile: File, sanitizedName: string): File => {
  return new File([originalFile], sanitizedName, { 
    type: originalFile.type,
    lastModified: originalFile.lastModified
  });
};

/**
 * Input validation for text fields
 */
export const validateTextInput = (input: string, maxLength: number = 1000): { isValid: boolean; error?: string; sanitized: string } => {
  // Basic length check
  if (input.length > maxLength) {
    return {
      isValid: false,
      error: `Input exceeds maximum length of ${maxLength} characters`,
      sanitized: input.substring(0, maxLength)
    };
  }

  // Remove dangerous characters
  const sanitized = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+\s*=/gi, ''); // Remove event handlers

  return {
    isValid: true,
    sanitized: sanitized.trim()
  };
};

/**
 * URL validation and sanitization
 */
export const validateAndSanitizeUrl = (url: string): { isValid: boolean; error?: string; sanitized?: string } => {
  try {
    const urlObj = new URL(url);
    
    // Only allow HTTP/HTTPS protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return {
        isValid: false,
        error: 'Only HTTP and HTTPS URLs are allowed'
      };
    }

    return {
      isValid: true,
      sanitized: urlObj.toString()
    };
  } catch (error) {
    return {
      isValid: false,
      error: 'Invalid URL format'
    };
  }
};

/**
 * Project name validation
 */
export const validateProjectName = (name: string): { isValid: boolean; error?: string; sanitized: string } => {
  const sanitized = name.trim();
  
  if (sanitized.length === 0) {
    return {
      isValid: false,
      error: 'Project name cannot be empty',
      sanitized
    };
  }

  if (sanitized.length > 100) {
    return {
      isValid: false,
      error: 'Project name cannot exceed 100 characters',
      sanitized: sanitized.substring(0, 100)
    };
  }

  // Remove dangerous characters but allow spaces and common punctuation
  const cleanName = sanitized.replace(/[<>\"'&]/g, '');
  
  return {
    isValid: true,
    sanitized: cleanName
  };
};