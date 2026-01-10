# UFABC Parser Webhook Integration Guide

This document outlines the webhook integration between the UFABC Parser and UFABC Next Backend, detailing the expected payload structures, error handling, and implementation requirements for the parser team.

## Overview

The webhook system allows the UFABC Parser to send real-time updates about student history processing. The system handles both successful processing results and error scenarios through standardized payload structures.

## Webhook Endpoints

### 1. POST /webhook/history

**Purpose**: Submit student history data for processing or report errors
**Authentication**: `x-api-key` header required
**Response**: `200 OK` with job tracking information

### 2. GET /webhook/history/{jobId}/status

**Purpose**: Check processing status of submitted jobs
**Authentication**: `x-api-key` header required
**Response**: `200 OK` with job status and timeline

## Success Payload Structure

When student history processing completes successfully, send:

```json
{
  "type": "history.success",
  "payload": {
    "ra": "string",
    "timestamp": "2024-01-15T10:30:00Z",
    "processing": {
      "duration": 1500,
      "version": "1.2.3",
      "environment": "production"
    },
    "student": {
      "ra": "string",
      "name": "string",
      "course": "string",
      "campus": "string",
      "shift": "string",
      "startedAt": "string"
    },
    "components": [
      {
        "UFCode": "string",
        "name": "string",
        "grade": "A" | "B" | "C" | "D" | "O" | "F" | "E" | null,
        "status": "string",
        "year": "string",
        "period": "1" | "2" | "3",
        "credits": number,
        "category": "mandatory" | "free" | "limited",
        "class": "string" | undefined,
        "teachers": ["string"] | undefined
      }
    ],
    "graduations": {
      "course": "string",
      "campus": "string" | undefined,
      "shift": "string",
      "grade": "string" | undefined,
      "freeCredits": number,
      "mandatoryCredits": number,
      "limitedCredits": number,
      "extensionCredits": number,
      "completedFreeCredits": number,
      "completedMandatoryCredits": number,
      "completedLimitedCredits": number,
      "completedExtensionCredits": number,
      "completedTotalCredits": number,
      "totalCredits": number
    },
    "coefficients": {
      "cr": number,
      "ca": number,
      "cp": number,
      "ik": number,
      "crece": number,
      "caece": number,
      "cpece": number,
      "ikece": number,
      "caik": number
    }
  }
}
```

## Error Payload Structure

When processing fails, send standardized error information:

```json
{
  "type": "history.error",
  "payload": {
    "ra": "string",
    "timestamp": "2024-01-15T10:30:00Z",
    "processing": {
      "duration": 1200,
      "version": "1.2.3",
      "environment": "production"
    },
    "error": {
      "title": "string",
      "code": "string",
      "httpStatus": number,
      "description": "string",
      "additionalData": Record<string, unknown> | null
    },
    "partialData": {
      "student": {
        "ra": "string",
        "name": "string",
        "course": "string",
        "campus": "string",
        "shift": "string",
        "startedAt": "string"
      } | undefined,
      "components": [Component] | undefined,
      "graduations": Graduation | undefined,
      "coefficients": Coefficients | undefined
    }
  }
}
```

## Error Codes and Types

The parser should use the following error classes and codes:

### System Errors

- **UFP0013**: `StudentHistoryCreationError` - Failed to create student history
- **UFP0014**: `StudentMismatchStatusError` - Student has unexpected status
- **UFP0015**: `StudentNotFoundError` - Student not found in system
- **UFP0016**: `ValidationError` - Invalid input data

### Error Structure Template

```typescript
{
  "title": "Student Not Found Error",
  "code": "UFP0015",
  "httpStatus": 404,
  "description": "Student with RA 123456 not found",
  "additionalData": {
    "studentRa": "123456"
  }
}
```

## Field Descriptions

### Student Object

- `ra`: Student registration number (required)
- `name`: Full student name (required)
- `course`: Course name (required)
- `campus`: Campus location (optional)
- `shift`: Study period shift (required)
- `startedAt`: When student started the course (required)

### Component Object

- `UFCode`: UFABC subject code (required)
- `name`: Subject name (required)
- `grade`: Final grade (A, B, C, D, O, F, E) or null (required)
- `status`: Academic status (required)
- `year`: Academic year (required)
- `period`: Academic period (1, 2, or 3) (required)
- `credits`: Credit count (required)
- `category`: Subject classification (mandatory/free/limited) (required)
- `class`: Class identifier (optional)
- `teachers`: Array of teacher names (optional)

### Graduations Object

Contains graduation progress information with completed and required credits for different categories.

### Coefficients Object

Contains academic performance coefficients:

- `cr`: Coefficient of Rendimento
- `ca`: Coefficient of Average
- `cp`: Coefficient of Performance
- `ik`: Index of Knowledge
- `crece`: CRECE coefficient
- `caece`: CAECE coefficient
- `cpece`: CPECE coefficient
- `ikece`: IKECE coefficient
- `caik`: CAIK coefficient

## Processing Flow

1. **Submit Data**: Parser sends webhook with `history.success` or `history.error`
2. **Immediate Response**: Backend returns `200 OK` with job ID
3. **Background Processing**: Data is processed asynchronously
4. **Status Check**: Parser can query job status via GET endpoint

## Response Examples

### Success Response

```json
{
  "status": "accepted",
  "jobId": "507f1f77bcf86cd799439011",
  "message": "Webhook received and queued for processing",
  "timestamp": "2024-01-15T10:31:00Z"
}
```

### Error Response

```json
{
  "status": "rejected",
  "jobId": "507f1f77bcf86cd799439011",
  "message": "Webhook error processed and marked as failed",
  "timestamp": "2024-01-15T10:31:00Z"
}
```

### Duplicate Request Response

```json
{
  "error": "Duplicate webhook request",
  "existingJobId": "507f1f77bcf86cd799439011"
}
```

### Authentication Error

```json
{
  "error": "Invalid API key"
}
```

## Implementation Requirements

### 1. Webhook Client Configuration

- Configure webhook URL: `https://api.ufabc.next/webhook/history`
- Set `x-api-key` header with provided authentication key
- Handle both success and error response scenarios
- Implement retry logic with exponential backoff

### 2. Idempotency

- Include unique timestamp in each request
- Backend uses `ra-timestamp` combination for idempotency
- Duplicate requests are rejected with `409 Conflict`

### 3. Error Handling

- Use standardized error structure for all processing failures
- Include any partial data that was successfully processed
- Provide meaningful error descriptions and additional context

### 4. Status Monitoring

- Poll job status endpoint for long-running processes
- Handle job completion, failure, and timeout scenarios
- Store job IDs for tracking and debugging

## Testing

### Webhook Testing Endpoint

- **Staging URL**: `https://staging.ufabc.next/webhook/history`
- **Test API Key**: Provided separately
- **Response Headers**: Include `x-job-id` for tracking

### Test Payloads

```bash
# Success test
curl -X POST https://staging.ufabc.next/webhook/history \
  -H "Content-Type: application/json" \
  -H "x-api-key: test-key" \
  -d '{"type":"history.success","payload":{...}}'

# Error test
curl -X POST https://staging.ufabc.next/webhook/history \
  -H "Content-Type: application/json" \
  -H "x-api-key: test-key" \
  -d '{"type":"history.error","payload":{...}}'

# Status check
curl -X GET https://staging.ufabc.next/webhook/history/{jobId}/status \
  -H "x-api-key: test-key"
```

## Security Considerations

- API key authentication required for all requests
- HTTPS only for production endpoints
- Rate limiting may be applied
- Payload size limited to 10MB
- Invalid payloads receive `400 Bad Request` responses

## Monitoring and Debugging

### Headers to Include

- `x-parser-version`: Parser software version
- `x-request-id`: Unique request identifier
- `x-processing-time`: Total processing duration in ms

### Logging

- Log all webhook requests and responses
- Include request IDs for correlation
- Monitor for failed deliveries and retries
- Track processing performance metrics

## Migration Timeline

1. **Phase 1** (Current): Backend updated to handle new payload structure
2. **Phase 2**: Parser team implements new payload format
3. **Phase 3**: Joint testing and validation
4. **Phase 4**: Production deployment with monitoring

## Support

For technical questions or issues:

- Create GitHub issue in: `ufabc-next/ufabc-next-backend`
- Tag with `webhook-integration` label
- Include request IDs and error codes in reports

---

_Last Updated: January 4, 2026_
_Version: 1.0_
