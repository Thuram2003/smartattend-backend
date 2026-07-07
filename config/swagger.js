import swaggerJsdoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SmartAttend API',
      version: '1.0.0',
      description: 'Attendance Management System API Documentation',
      contact: {
        name: 'API Support',
        email: 'support@smartattend.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      },
      {
        url: 'https://api.smartattend.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'token',
          description: 'JWT token stored in HTTP-only cookie'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            fullName: {
              type: 'string',
              example: 'John Doe'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john@example.com'
            },
            role: {
              type: 'string',
              enum: ['student', 'lecturer'],
              example: 'student'
            },
            studentId: {
              type: 'string',
              example: 'STU2024001'
            },
            department: {
              type: 'string',
              example: 'Computer Science'
            },
            profilePhoto: {
              type: 'string',
              example: 'https://cloudinary.com/photo.jpg'
            },
            isVerified: {
              type: 'boolean',
              example: true
            }
          }
        },
        Course: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            name: {
              type: 'string',
              example: 'Introduction to Computer Science'
            },
            code: {
              type: 'string',
              example: 'CS101'
            },
            lecturer: {
              type: 'string',
              example: '507f1f77bcf86cd799439012'
            },
            students: {
              type: 'array',
              items: {
                type: 'string'
              }
            }
          }
        },
        Session: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            course: {
              type: 'string',
              example: '507f1f77bcf86cd799439012'
            },
            lecturer: {
              type: 'string',
              example: '507f1f77bcf86cd799439013'
            },
            qrToken: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
            },
            pin: {
              type: 'string',
              example: '1234'
            },
            qrExpiresAt: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-01T12:30:00Z'
            },
            windowClosesAt: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-01T12:45:00Z'
            },
            isActive: {
              type: 'boolean',
              example: true
            }
          }
        },
        Attendance: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            student: {
              type: 'string',
              example: '507f1f77bcf86cd799439012'
            },
            session: {
              type: 'string',
              example: '507f1f77bcf86cd799439013'
            },
            photoUrl: {
              type: 'string',
              example: 'https://cloudinary.com/selfie.jpg'
            },
            deviceFingerprint: {
              type: 'string',
              example: 'fp_abc123xyz'
            },
            location: {
              type: 'object',
              properties: {
                lat: {
                  type: 'number',
                  example: 6.5244
                },
                log: {
                  type: 'number',
                  example: 3.3792
                }
              }
            },
            status: {
              type: 'string',
              enum: ['present', 'suspicious'],
              example: 'present'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'Error message here'
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Operation successful'
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication endpoints'
      },
      {
        name: 'Courses',
        description: 'Course management endpoints'
      },
      {
        name: 'Sessions',
        description: 'Attendance session management'
      },
      {
        name: 'Attendance',
        description: 'Attendance marking and tracking'
      }
    ]
  },
  apis: ['./routes/*.js', './controllers/*.js']
}

const swaggerSpec = swaggerJsdoc(options)

export { swaggerUi, swaggerSpec }
