const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SOYTE Backend API',
      version: '1.0.0',
      description: 'API quản lý cơ sở y tế xã hội — Sức khoẻ Thủ Đô',
    },
    servers: [
      ...(process.env.SWAGGER_SERVER_URL
        ? [{ url: process.env.SWAGGER_SERVER_URL, description: 'Current Server' }]
        : []),
      { url: 'http://160.30.252.42:3000', description: 'Server nội bộ' },
      { url: 'https://suckhoethudo.vn', description: 'Production' },
      { url: `http://localhost:${process.env.PORT || 3000}`, description: 'Local Dev' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        // ─── Common ───────────────────────────────────────────────
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data: { type: 'object' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
          },
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            totalItems: { type: 'integer' },
            totalPages: { type: 'integer' },
            currentPage: { type: 'integer' },
          },
        },

        // ─── Auth ─────────────────────────────────────────────────
        RegisterBody: {
          type: 'object',
          required: ['email', 'password', 'full_name'],
          properties: {
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            password: { type: 'string', minLength: 8, example: 'Password123' },
            full_name: { type: 'string', example: 'Nguyễn Văn A' },
            username: { type: 'string', example: 'nguyenvana' },
            role: { type: 'string', enum: ['admin', 'user', 'office', 'leader'], default: 'user' },
            unit: { type: 'string', example: '1' },
            permissions: { type: 'array', items: { type: 'string' }, example: ['posts.view'] },
          },
        },
        LoginBody: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            password: { type: 'string', example: 'Password123' },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                token: { type: 'string' },
                user: { $ref: '#/components/schemas/User' },
              },
            },
          },
        },

        // ─── User ─────────────────────────────────────────────────
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            email: { type: 'string', format: 'email' },
            full_name: { type: 'string' },
            role: { type: 'string', enum: ['admin', 'user', 'office', 'leader'] },
            unit: { type: 'string' },
            is_verified: { type: 'boolean' },
            status: { type: 'integer' },
            created_at: { type: 'string', format: 'date-time' },
            permissions: {
              type: 'array',
              items: { type: 'object', properties: { name: { type: 'string' } } },
            },
          },
        },

        // ─── Post ─────────────────────────────────────────────────
        Post: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            title: { type: 'string' },
            summary: { type: 'string' },
            content: { type: 'string' },
            image_url: { type: 'string' },
            status: { type: 'string', enum: ['draft', 'published'] },
            is_featured: { type: 'boolean' },
            category_id: { type: 'integer' },
            author_id: { type: 'integer' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        PostBody: {
          type: 'object',
          required: ['title'],
          properties: {
            title: { type: 'string', example: 'Thông báo mới' },
            summary: { type: 'string' },
            content: { type: 'string' },
            image_url: { type: 'string', format: 'uri' },
            status: { type: 'string', enum: ['draft', 'published'], default: 'draft' },
            is_featured: { type: 'boolean', default: false },
            category_id: { type: 'integer' },
            expires_at: { type: 'string', format: 'date-time' },
          },
        },

        // ─── Schedule ─────────────────────────────────────────────
        Schedule: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            title: { type: 'string' },
            content: { type: 'string' },
            start_time: { type: 'string', format: 'date-time' },
            end_time: { type: 'string', format: 'date-time' },
            location: { type: 'string' },
            status: { type: 'string', enum: ['DRAFT', 'APPROVED', 'CANCELLED'] },
            priority: { type: 'string', enum: ['NORMAL', 'IMPORTANT', 'URGENT'] },
            presider: { type: 'object', properties: { id: { type: 'integer' }, full_name: { type: 'string' } } },
            attendees: { type: 'array', items: { type: 'object', properties: { id: { type: 'integer' }, full_name: { type: 'string' } } } },
            attachments: { type: 'array', items: { type: 'object' } },
          },
        },
        ScheduleBody: {
          type: 'object',
          required: ['title', 'start_time', 'end_time'],
          properties: {
            title: { type: 'string', example: 'Họp giao ban tuần' },
            content: { type: 'string' },
            start_time: { type: 'string', format: 'date-time', example: '2026-05-10T08:00:00' },
            end_time: { type: 'string', format: 'date-time', example: '2026-05-10T10:00:00' },
            location: { type: 'string', example: 'Phòng họp A' },
            priority: { type: 'string', enum: ['NORMAL', 'IMPORTANT', 'URGENT'], default: 'NORMAL' },
            presider_id: { type: 'integer' },
            coordinating_unit: { type: 'string' },
            internal_notes: { type: 'string' },
            license_plate: { type: 'string' },
            attendee_ids: { type: 'array', items: { type: 'integer' }, example: [1, 2, 3] },
          },
        },

        // ─── Feedback ─────────────────────────────────────────────
        FeedbackBody: {
          type: 'object',
          required: ['form_id', 'type', 'submission_data'],
          properties: {
            form_id: { type: 'integer', example: 1 },
            type: { type: 'string', enum: ['reflect', 'evaluate'], example: 'reflect' },
            creator_name: { type: 'string', example: 'Nguyễn Văn A' },
            info: { type: 'object', description: 'Thông tin đơn vị dạng JSON' },
            survey_key: { type: 'string' },
            submission_data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  options: { type: 'array', items: { type: 'object' } },
                },
              },
            },
          },
        },

        // ─── Survey ───────────────────────────────────────────────
        Survey: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            type: { type: 'string', enum: ['reflect', 'evaluate'] },
            status: { type: 'boolean' },
            date_from: { type: 'string', format: 'date' },
            date_to: { type: 'string', format: 'date' },
            form_ids: { type: 'array', items: { type: 'integer' } },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        SurveyBody: {
          type: 'object',
          required: ['name', 'type'],
          properties: {
            name: { type: 'string', example: 'Khảo sát quý 1/2026' },
            type: { type: 'string', enum: ['reflect', 'evaluate'] },
            status: { type: 'boolean', default: true },
            date_from: { type: 'string', format: 'date', example: '2026-01-01' },
            date_to: { type: 'string', format: 'date', example: '2026-03-31' },
            form_ids: { type: 'array', items: { type: 'integer' }, example: [1, 2] },
          },
        },

        // ─── Social Facility ──────────────────────────────────────
        SocialFacility: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            type: { type: 'string' },
            category: { type: 'string' },
            address: { type: 'string' },
            lat: { type: 'number' },
            lng: { type: 'number' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        SocialFacilityBody: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', example: 'Trung tâm Y tế Quận 1' },
            type: { type: 'string', example: 'hospital' },
            category: { type: 'string' },
            address: { type: 'string', example: '123 Đường ABC, Quận 1, HN' },
            lat: { type: 'number', example: 21.0245 },
            lng: { type: 'number', example: 105.8412 },
          },
        },

        // ─── Permission ───────────────────────────────────────────
        Permission: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string', example: 'posts.view' },
            parent_id: { type: 'integer', nullable: true },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Xác thực người dùng' },
      { name: 'Users', description: 'Quản lý tài khoản' },
      { name: 'Posts', description: 'Tin tức / Thông báo' },
      { name: 'Schedules', description: 'Lịch công tác' },
      { name: 'Feedbacks', description: 'Phản hồi & Đánh giá' },
      { name: 'Surveys', description: 'Khảo sát' },
      { name: 'Social Facilities', description: 'Cơ sở y tế xã hội' },
      { name: 'Affiliated Facilities', description: 'Cơ sở trực thuộc' },
      { name: 'Permissions', description: 'Phân quyền hệ thống' },
      { name: 'Upload', description: 'Tải file lên' },
      { name: 'Email', description: 'Cấu hình & xác nhận email' },
      { name: 'Reports', description: 'Báo cáo' },
      { name: 'Crawler', description: 'Cào dữ liệu lịch công tác' },
    ],
    paths: {
      // ══════════════════════════════════════════════════════════
      //  AUTH
      // ══════════════════════════════════════════════════════════
      '/api/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Đăng ký tài khoản mới',
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterBody' } } } },
          responses: {
            201: { description: 'Tạo tài khoản thành công' },
            409: { description: 'Email hoặc tên đăng nhập đã tồn tại' },
          },
        },
      },
      '/api/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Đăng nhập',
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginBody' } } } },
          responses: {
            200: { description: 'Đăng nhập thành công', content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginResponse' } } } },
            401: { description: 'Sai email hoặc mật khẩu' },
          },
        },
      },
      '/api/auth/me': {
        get: {
          tags: ['Auth'],
          summary: 'Lấy thông tin người dùng đang đăng nhập',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Thành công' },
            401: { description: 'Chưa xác thực' },
          },
        },
      },
      '/api/auth/check-token/{token}': {
        get: {
          tags: ['Auth'],
          summary: 'Kiểm tra token đặt lại mật khẩu còn hiệu lực không',
          parameters: [{ name: 'token', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Token hợp lệ' }, 400: { description: 'Token không hợp lệ hoặc hết hạn' } },
        },
      },
      '/api/auth/confirm-password': {
        post: {
          tags: ['Auth'],
          summary: 'Xác nhận / đặt mật khẩu lần đầu bằng token email',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['token', 'password'],
                  properties: {
                    token: { type: 'string' },
                    password: { type: 'string', minLength: 8 },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Xác nhận thành công' }, 400: { description: 'Token không hợp lệ' } },
        },
      },
      '/api/auth/change-password': {
        put: {
          tags: ['Auth'],
          summary: 'Đổi mật khẩu',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['oldPassword', 'newPassword'],
                  properties: {
                    oldPassword: { type: 'string' },
                    newPassword: { type: 'string', minLength: 8 },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Đổi mật khẩu thành công' }, 401: { description: 'Mật khẩu cũ không đúng' } },
        },
      },
      '/api/auth/forgot-password': {
        post: {
          tags: ['Auth'],
          summary: 'Quên mật khẩu — gửi email đặt lại',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    email: { type: 'string', format: 'email' },
                    username: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Email đã được gửi' } },
        },
      },
      '/api/auth/resend-confirmation': {
        post: {
          tags: ['Auth'],
          summary: 'Gửi lại email xác nhận tài khoản (Admin)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', properties: { email: { type: 'string', format: 'email' } } } } },
          },
          responses: { 200: { description: 'Đã gửi lại email' } },
        },
      },
      '/api/auth/resend-verification': {
        post: {
          tags: ['Auth'],
          summary: 'Gửi lại email xác minh',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', properties: { email: { type: 'string', format: 'email' } } } } },
          },
          responses: { 200: { description: 'Đã gửi lại email' } },
        },
      },

      // ══════════════════════════════════════════════════════════
      //  USERS
      // ══════════════════════════════════════════════════════════
      '/api/users': {
        get: {
          tags: ['Users'],
          summary: 'Lấy danh sách người dùng',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
            { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Tìm kiếm theo tên/email' },
            { name: 'role', in: 'query', schema: { type: 'string', enum: ['admin', 'user', 'office', 'leader'] } },
            { name: 'unit', in: 'query', schema: { type: 'string' } },
          ],
          responses: { 200: { description: 'Thành công' } },
        },
      },
      '/api/users/{id}': {
        get: {
          tags: ['Users'],
          summary: 'Lấy thông tin người dùng theo ID',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'Thành công' }, 404: { description: 'Không tìm thấy' } },
        },
        put: {
          tags: ['Users'],
          summary: 'Cập nhật thông tin người dùng',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    full_name: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    role: { type: 'string', enum: ['admin', 'user', 'office', 'leader'] },
                    unit: { type: 'string' },
                    is_verified: { type: 'boolean' },
                    permissions: { type: 'array', items: { type: 'string' } },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Cập nhật thành công' } },
        },
        delete: {
          tags: ['Users'],
          summary: 'Xóa người dùng',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'Xóa thành công' }, 404: { description: 'Không tìm thấy' } },
        },
      },
      '/api/users/{id}/permissions': {
        post: {
          tags: ['Users'],
          summary: 'Gán quyền cho người dùng',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['permissions'],
                  properties: { permissions: { type: 'array', items: { type: 'string' }, example: ['posts.view', 'work_schedule'] } },
                },
              },
            },
          },
          responses: { 200: { description: 'Gán quyền thành công' } },
        },
      },
      '/api/users/leaders': {
        get: {
          tags: ['Users'],
          summary: 'Lấy danh sách lãnh đạo (role = LEADER)',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Thành công' } },
        },
      },

      // ══════════════════════════════════════════════════════════
      //  POSTS
      // ══════════════════════════════════════════════════════════
      '/api/posts': {
        get: {
          tags: ['Posts'],
          summary: 'Lấy danh sách bài viết',
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['draft', 'published'] } },
            { name: 'category_id', in: 'query', schema: { type: 'integer' } },
            { name: 'is_featured', in: 'query', schema: { type: 'boolean' } },
            { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Tìm kiếm theo tiêu đề' },
          ],
          responses: { 200: { description: 'Thành công' } },
        },
        post: {
          tags: ['Posts'],
          summary: 'Tạo bài viết mới',
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/PostBody' } } } },
          responses: { 201: { description: 'Tạo thành công' } },
        },
      },
      '/api/posts/by-categories': {
        post: {
          tags: ['Posts'],
          summary: 'Lấy bài viết theo nhiều danh mục',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      category_id: { type: 'integer' },
                      limit: { type: 'integer', maximum: 50 },
                    },
                  },
                  example: [{ category_id: 1, limit: 5 }, { category_id: 2, limit: 3 }],
                },
              },
            },
          },
          responses: { 200: { description: 'Thành công' } },
        },
      },
      '/api/posts/sub': {
        get: {
          tags: ['Posts'],
          summary: 'Cào và lưu tin tức từ nguồn bên ngoài',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Thành công' } },
        },
      },
      '/api/posts/{id}': {
        get: {
          tags: ['Posts'],
          summary: 'Lấy chi tiết bài viết',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'Thành công' }, 404: { description: 'Không tìm thấy' } },
        },
        put: {
          tags: ['Posts'],
          summary: 'Cập nhật bài viết',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/PostBody' } } } },
          responses: { 200: { description: 'Cập nhật thành công' } },
        },
        delete: {
          tags: ['Posts'],
          summary: 'Xóa bài viết',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'Xóa thành công' } },
        },
      },

      // ══════════════════════════════════════════════════════════
      //  SCHEDULES
      // ══════════════════════════════════════════════════════════
      '/api/schedules': {
        get: {
          tags: ['Schedules'],
          summary: 'Lấy danh sách lịch công tác',
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
            { name: 'start_date', in: 'query', schema: { type: 'string', format: 'date' } },
            { name: 'end_date', in: 'query', schema: { type: 'string', format: 'date' } },
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['DRAFT', 'APPROVED', 'CANCELLED'] } },
            { name: 'priority', in: 'query', schema: { type: 'string', enum: ['NORMAL', 'IMPORTANT', 'URGENT'] } },
            { name: 'keyword', in: 'query', schema: { type: 'string' } },
            { name: 'leader_id', in: 'query', schema: { type: 'integer' } },
          ],
          responses: { 200: { description: 'Thành công' } },
        },
        post: {
          tags: ['Schedules'],
          summary: 'Tạo lịch công tác mới',
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ScheduleBody' } } } },
          responses: { 201: { description: 'Tạo thành công' } },
        },
      },
      '/api/schedules/export/excel': {
        get: {
          tags: ['Schedules'],
          summary: 'Xuất danh sách lịch công tác ra Excel',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'start_date', in: 'query', schema: { type: 'string', format: 'date' } },
            { name: 'end_date', in: 'query', schema: { type: 'string', format: 'date' } },
            { name: 'status', in: 'query', schema: { type: 'string' } },
          ],
          responses: { 200: { description: 'File Excel', content: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {} } } },
        },
      },
      '/api/schedules/export/pdf': {
        get: {
          tags: ['Schedules'],
          summary: 'Xuất danh sách lịch công tác ra PDF',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'File PDF', content: { 'application/pdf': {} } } },
        },
      },
      '/api/schedules/{id}': {
        get: {
          tags: ['Schedules'],
          summary: 'Lấy chi tiết lịch công tác',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'Thành công' }, 404: { description: 'Không tìm thấy' } },
        },
        put: {
          tags: ['Schedules'],
          summary: 'Cập nhật lịch công tác',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ScheduleBody' } } } },
          responses: { 200: { description: 'Cập nhật thành công' } },
        },
        delete: {
          tags: ['Schedules'],
          summary: 'Xóa lịch công tác',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'Xóa thành công' } },
        },
      },
      '/api/schedules/{id}/approve': {
        patch: {
          tags: ['Schedules'],
          summary: 'Phê duyệt lịch công tác',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'Phê duyệt thành công' } },
        },
      },
      '/api/schedules/{id}/cancel': {
        patch: {
          tags: ['Schedules'],
          summary: 'Hủy lịch công tác',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'Hủy thành công' } },
        },
      },
      '/api/schedules/{id}/attachments': {
        post: {
          tags: ['Schedules'],
          summary: 'Thêm file đính kèm vào lịch công tác',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: {
            required: true,
            content: { 'multipart/form-data': { schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } } },
          },
          responses: { 201: { description: 'Tải lên thành công' } },
        },
      },
      '/api/attachments/{id}': {
        delete: {
          tags: ['Schedules'],
          summary: 'Xóa file đính kèm',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'Xóa thành công' } },
        },
      },

      // ══════════════════════════════════════════════════════════
      //  FEEDBACKS
      // ══════════════════════════════════════════════════════════
      '/api/feedbacks': {
        post: {
          tags: ['Feedbacks'],
          summary: 'Gửi phản hồi / đánh giá mới',
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/FeedbackBody' } } } },
          responses: { 201: { description: 'Gửi thành công' }, 400: { description: 'Đơn vị đã gửi phản hồi cho khảo sát này' } },
        },
        get: {
          tags: ['Feedbacks'],
          summary: 'Lấy danh sách phản hồi',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
            { name: 'type', in: 'query', schema: { type: 'string', enum: ['reflect', 'evaluate'] } },
            { name: 'survey_key', in: 'query', schema: { type: 'string' } },
            { name: 'unit_id', in: 'query', schema: { type: 'string' } },
            { name: 'unit_type', in: 'query', schema: { type: 'string' } },
            { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
            { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } },
          ],
          responses: { 200: { description: 'Thành công' } },
        },
      },
      '/api/feedbacks/list': {
        post: {
          tags: ['Feedbacks'],
          summary: 'Lấy danh sách phản hồi (POST với body filter)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    type: { type: 'string', enum: ['reflect', 'evaluate'] },
                    survey_key: { type: 'string' },
                    unit_id: { type: 'string' },
                    page: { type: 'integer' },
                    limit: { type: 'integer' },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Thành công' } },
        },
      },
      '/api/feedbacks/stats': {
        get: {
          tags: ['Feedbacks'],
          summary: 'Thống kê phản hồi',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'type', in: 'query', schema: { type: 'string', enum: ['reflect', 'evaluate'] } },
            { name: 'survey_key', in: 'query', schema: { type: 'string' } },
            { name: 'report_type', in: 'query', schema: { type: 'integer', enum: [1, 2, 3] } },
            { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
            { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } },
          ],
          responses: { 200: { description: 'Thành công' } },
        },
        post: {
          tags: ['Feedbacks'],
          summary: 'Thống kê phản hồi (POST với body filter)',
          security: [{ bearerAuth: [] }],
          requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
          responses: { 200: { description: 'Thành công' } },
        },
      },
      '/api/feedbacks/compare': {
        get: {
          tags: ['Feedbacks'],
          summary: 'So sánh phản hồi giữa 2 kỳ khảo sát',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'type', in: 'query', schema: { type: 'string', enum: ['reflect', 'evaluate'] } },
            { name: 'survey_key', in: 'query', schema: { type: 'string' } },
            { name: 'report_type', in: 'query', schema: { type: 'integer', enum: [1, 2, 3] } },
          ],
          responses: { 200: { description: 'Thành công' } },
        },
        post: {
          tags: ['Feedbacks'],
          summary: 'So sánh phản hồi (POST với body filter)',
          security: [{ bearerAuth: [] }],
          requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
          responses: { 200: { description: 'Thành công' } },
        },
      },
      '/api/feedbacks/check-unit': {
        get: {
          tags: ['Feedbacks'],
          summary: 'Kiểm tra đơn vị đã nộp khảo sát chưa',
          parameters: [
            { name: 'unit_id', in: 'query', required: true, schema: { type: 'string' } },
            { name: 'type', in: 'query', schema: { type: 'string', enum: ['reflect', 'evaluate'] } },
            { name: 'survey_key', in: 'query', schema: { type: 'string' } },
          ],
          responses: { 200: { description: 'Thành công' } },
        },
      },
      '/api/feedbacks/{id}': {
        get: {
          tags: ['Feedbacks'],
          summary: 'Lấy chi tiết phản hồi',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'Thành công' }, 404: { description: 'Không tìm thấy' } },
        },
        delete: {
          tags: ['Feedbacks'],
          summary: 'Xóa phản hồi',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'Xóa thành công' } },
        },
      },

      // ══════════════════════════════════════════════════════════
      //  SURVEYS
      // ══════════════════════════════════════════════════════════
      '/api/surveys': {
        get: {
          tags: ['Surveys'],
          summary: 'Lấy danh sách khảo sát',
          responses: { 200: { description: 'Thành công' } },
        },
        post: {
          tags: ['Surveys'],
          summary: 'Tạo khảo sát mới',
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/SurveyBody' } } } },
          responses: { 201: { description: 'Tạo thành công' } },
        },
      },
      '/api/surveys/{id}': {
        get: {
          tags: ['Surveys'],
          summary: 'Lấy chi tiết khảo sát',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'Thành công' }, 404: { description: 'Không tìm thấy' } },
        },
        put: {
          tags: ['Surveys'],
          summary: 'Cập nhật khảo sát',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/SurveyBody' } } } },
          responses: { 200: { description: 'Cập nhật thành công' } },
        },
        delete: {
          tags: ['Surveys'],
          summary: 'Xóa khảo sát',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'Xóa thành công' } },
        },
      },

      // ══════════════════════════════════════════════════════════
      //  SOCIAL FACILITIES
      // ══════════════════════════════════════════════════════════
      '/api/social-facilities': {
        get: {
          tags: ['Social Facilities'],
          summary: 'Lấy danh sách cơ sở y tế xã hội',
          responses: { 200: { description: 'Thành công' } },
        },
        post: {
          tags: ['Social Facilities'],
          summary: 'Tạo cơ sở mới',
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/SocialFacilityBody' } } } },
          responses: { 201: { description: 'Tạo thành công' } },
        },
      },
      '/api/social-facilities/{id}': {
        get: {
          tags: ['Social Facilities'],
          summary: 'Lấy chi tiết cơ sở',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'Thành công' }, 404: { description: 'Không tìm thấy' } },
        },
        put: {
          tags: ['Social Facilities'],
          summary: 'Cập nhật cơ sở',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/SocialFacilityBody' } } } },
          responses: { 200: { description: 'Cập nhật thành công' } },
        },
        delete: {
          tags: ['Social Facilities'],
          summary: 'Xóa cơ sở',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'Xóa thành công' } },
        },
      },

      // ══════════════════════════════════════════════════════════
      //  AFFILIATED FACILITIES
      // ══════════════════════════════════════════════════════════
      '/api/affiliated-facilities': {
        get: { tags: ['Affiliated Facilities'], summary: 'Lấy danh sách cơ sở trực thuộc', responses: { 200: { description: 'Thành công' } } },
        post: {
          tags: ['Affiliated Facilities'],
          summary: 'Tạo cơ sở trực thuộc',
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
          responses: { 201: { description: 'Tạo thành công' } },
        },
      },
      '/api/affiliated-facilities/{id}': {
        get: {
          tags: ['Affiliated Facilities'],
          summary: 'Chi tiết cơ sở trực thuộc',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'Thành công' } },
        },
        put: {
          tags: ['Affiliated Facilities'],
          summary: 'Cập nhật cơ sở trực thuộc',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
          responses: { 200: { description: 'Cập nhật thành công' } },
        },
        delete: {
          tags: ['Affiliated Facilities'],
          summary: 'Xóa cơ sở trực thuộc',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'Xóa thành công' } },
        },
      },

      // ══════════════════════════════════════════════════════════
      //  PERMISSIONS
      // ══════════════════════════════════════════════════════════
      '/api/permissions': {
        get: {
          tags: ['Permissions'],
          summary: 'Lấy toàn bộ danh sách quyền',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Thành công' } },
        },
        post: {
          tags: ['Permissions'],
          summary: 'Tạo quyền mới',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name'],
                  properties: { name: { type: 'string', example: 'posts.create' }, parent_id: { type: 'integer', nullable: true } },
                },
              },
            },
          },
          responses: { 201: { description: 'Tạo thành công' } },
        },
      },
      '/api/permissions/{id}': {
        get: {
          tags: ['Permissions'],
          summary: 'Chi tiết quyền',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'Thành công' } },
        },
        put: {
          tags: ['Permissions'],
          summary: 'Cập nhật quyền',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' } } } } } },
          responses: { 200: { description: 'Cập nhật thành công' } },
        },
        delete: {
          tags: ['Permissions'],
          summary: 'Xóa quyền',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'Xóa thành công' } },
        },
      },

      // ══════════════════════════════════════════════════════════
      //  UPLOAD
      // ══════════════════════════════════════════════════════════
      '/api/upload': {
        post: {
          tags: ['Upload'],
          summary: 'Tải lên 1 file',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'multipart/form-data': { schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } } },
          },
          responses: { 200: { description: 'Tải lên thành công', content: { 'application/json': { schema: { type: 'object', properties: { url: { type: 'string' } } } } } } },
        },
      },
      '/api/upload/multiple': {
        post: {
          tags: ['Upload'],
          summary: 'Tải lên nhiều file cùng lúc',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'multipart/form-data': { schema: { type: 'object', properties: { files: { type: 'array', items: { type: 'string', format: 'binary' } } } } } },
          },
          responses: { 200: { description: 'Tải lên thành công' } },
        },
      },

      // ══════════════════════════════════════════════════════════
      //  EMAIL CONFIRM
      // ══════════════════════════════════════════════════════════
      '/api/email-confirm/send-otp': {
        post: {
          tags: ['Email'],
          summary: 'Gửi OTP xác nhận email',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', properties: { email: { type: 'string', format: 'email' } } } } },
          },
          responses: { 200: { description: 'OTP đã gửi' } },
        },
      },
      '/api/email-confirm/verify-otp': {
        post: {
          tags: ['Email'],
          summary: 'Xác minh OTP email',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { type: 'object', properties: { email: { type: 'string' }, otp: { type: 'string' } } },
              },
            },
          },
          responses: { 200: { description: 'Xác minh thành công' } },
        },
      },

      // ══════════════════════════════════════════════════════════
      //  REPORTS
      // ══════════════════════════════════════════════════════════
      '/api/reports': {
        get: {
          tags: ['Reports'],
          summary: 'Tạo báo cáo',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'type', in: 'query', schema: { type: 'string' }, description: 'Loại báo cáo' },
            { name: 'survey_key', in: 'query', schema: { type: 'string' } },
            { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
            { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } },
          ],
          responses: { 200: { description: 'Thành công' } },
        },
      },

      // ══════════════════════════════════════════════════════════
      //  CRAWLER
      // ══════════════════════════════════════════════════════════
      '/api/crawled-schedules': {
        get: {
          tags: ['Crawler'],
          summary: 'Kích hoạt cào dữ liệu lịch công tác từ nguồn ngoài',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Cào và lưu thành công' } },
        },
      },
    },
  },
  apis: [],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
