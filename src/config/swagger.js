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
      // Ưu tiên: server URL từ biến môi trường (đặt trong .env trên server)
      ...(process.env.SWAGGER_SERVER_URL
        ? String(process.env.SWAGGER_SERVER_URL).split(',').map(u => ({ url: u.trim(), description: 'Current Server' }))
        : []),
      { url: 'https://suckhoethudo.vn', description: 'Production' },
      { url: 'http://160.30.252.42:3000', description: 'Server nội bộ' },
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

        // ─── Role ─────────────────────────────────────────────────
        RoleInput: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', example: 'Quản lý phòng khám' },
            description: { type: 'string', example: 'Quản lý toàn bộ phòng khám' },
            is_active: { type: 'boolean', default: true },
            permission_ids: { type: 'array', items: { type: 'integer' }, example: [1, 2, 5], description: 'Danh sách permission ID gắn vào role' },
          },
        },

        // ─── Trading Facility ─────────────────────────────────────
        TradingFacility: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            certificate_number: { type: 'string', example: '01-2759/ĐKKDD-HNO' },
            name: { type: 'string', example: 'NHÀ THUỐC ABC' },
            person_in_charge: { type: 'string', example: 'Nguyễn Văn A' },
            practice_certificate: { type: 'string', example: '00259/CCHND-SYT-HNO' },
            facility_type: { type: 'string', example: 'Nhà thuốc' },
            trading_type: { type: 'string', enum: ['wholesale', 'retail'] },
            address: { type: 'string', example: 'Số 1 Nguyễn Huy Tưởng, Hà Nội' },
            issue_date: { type: 'string', example: '21/07 2025' },
            gps_number: { type: 'string', example: '2759' },
            gps_issue_date: { type: 'string', example: '21/07 2025' },
            is_active: { type: 'boolean', example: true },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        TradingFacilityInput: {
          type: 'object',
          required: ['name', 'trading_type'],
          properties: {
            certificate_number: { type: 'string' },
            name: { type: 'string' },
            person_in_charge: { type: 'string' },
            practice_certificate: { type: 'string' },
            facility_type: { type: 'string' },
            trading_type: { type: 'string', enum: ['wholesale', 'retail'] },
            address: { type: 'string' },
            issue_date: { type: 'string' },
            gps_number: { type: 'string' },
            gps_issue_date: { type: 'string' },
            is_active: { type: 'boolean', default: true },
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

        // ─── Banner ───────────────────────────────────────────────
        Banner: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            position: { type: 'string', enum: ['top', 'left', 'right', 'footer'], example: 'top' },
            image_url: { type: 'string', format: 'uri', example: 'https://backend.suckhoethudo.vn/uploads/images/banner.jpg' },
            title: { type: 'string', nullable: true, example: 'Banner trang chủ' },
            link_url: { type: 'string', nullable: true, example: '/tin-tuc' },
            sort_order: { type: 'integer', default: 0, example: 0 },
            is_active: { type: 'boolean', default: true, example: true },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        BannerInput: {
          type: 'object',
          required: ['position', 'image_url'],
          properties: {
            position: { type: 'string', enum: ['top', 'left', 'right', 'footer'], example: 'top' },
            image_url: { type: 'string', format: 'uri', example: 'https://backend.suckhoethudo.vn/uploads/images/banner.jpg' },
            title: { type: 'string', nullable: true, example: 'Banner trang chủ' },
            link_url: { type: 'string', nullable: true, example: '/tin-tuc' },
            sort_order: { type: 'integer', default: 0, example: 0 },
            is_active: { type: 'boolean', default: true },
          },
        },

        // ─── Dataset ──────────────────────────────────────────────
        DatasetType: {
          type: 'object',
          properties: {
            id:            { type: 'integer', example: 1 },
            code:          { type: 'string', example: 'danh_muc_benh' },
            name:          { type: 'string', example: 'Danh mục bệnh' },
            description:   { type: 'string', nullable: true },
            fields:        { type: 'array', nullable: true, items: { $ref: '#/components/schemas/FieldDef' } },
            source_file:   { type: 'string', nullable: true, example: 'danh_muc_benh.xlsx' },
            total_records: { type: 'integer', example: 1234 },
            created_at:    { type: 'string', format: 'date-time' },
            updated_at:    { type: 'string', format: 'date-time' },
          },
        },
        DatasetTypeInput: {
          type: 'object',
          required: ['code', 'name'],
          properties: {
            code:        { type: 'string', example: 'danh_muc_benh', description: 'Mã định danh duy nhất (slug)' },
            name:        { type: 'string', example: 'Danh mục bệnh' },
            description: { type: 'string' },
            fields:      { type: 'array', items: { $ref: '#/components/schemas/FieldDef' } },
          },
        },
        FieldDef: {
          type: 'object',
          required: ['name'],
          properties: {
            name:     { type: 'string', example: 'ten_benh' },
            datatype: { type: 'string', enum: ['text', 'number', 'date', 'enum'], default: 'text' },
            values:   { type: 'array', items: { type: 'string' }, description: 'Chỉ dùng khi datatype=enum' },
          },
        },
        DatasetRecord: {
          type: 'object',
          properties: {
            id:         { type: 'integer', example: 1 },
            data:       { type: 'object', example: { ten_benh: 'Viêm phổi', ma_icd: 'J18' } },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
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
      { name: 'Trading Facilities', description: 'Cơ sở bán buôn / bán lẻ thuốc' },
      { name: 'Roles', description: 'Quản lý Role & phân quyền theo role' },
      { name: 'Crawler', description: 'Cào dữ liệu lịch công tác' },
      { name: 'Banners', description: 'Quản lý Banner (top / left / right / footer)' },
      { name: 'Datasets', description: 'Registry dữ liệu động (schema-less JSONB)' },
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
          summary: 'Gán quyền cá nhân cho người dùng (chỉ khi user KHÔNG có role)',
          description: '⚠️ Trả về lỗi 400 nếu user đang được gán role — hãy chỉnh sửa permissions của role hoặc hủy gán role trước.',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['permissions'],
                  properties: {
                    permissions: { type: 'array', items: { type: 'string' }, example: ['posts.view', 'work_schedule'] },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Gán quyền thành công' },
            400: { description: 'User đang có role — không thể sửa quyền cá nhân' },
          },
        },
      },
      '/api/users/{id}/role': {
        put: {
          tags: ['Users'],
          summary: 'Gán / hủy gán role cho người dùng',
          description: 'Truyền `role_id: null` để hủy gán role. Khi gán role, permissions sẽ tự động lấy từ role đó.',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    role_id: { type: 'integer', nullable: true, example: 2, description: 'ID của role cần gán. null = hủy gán' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Thành công — trả về user với permissions mới theo role' },
            404: { description: 'Không tìm thấy user hoặc role' },
          },
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
      '/api/feedbacks/evaluate-dashboard': {
        get: {
          tags: ['Feedbacks'],
          summary: 'Dashboard giám sát chất lượng (biểu đồ evaluate)',
          description: [
            'Không truyền survey_key → tất cả khảo sát evaluate trong 1 năm gần nhất.',
            'Truyền 1 survey_key → theo 1 cuộc khảo sát.',
            'Truyền nhiều survey_key → gộp nhiều cuộc khảo sát.',
            'Hỗ trợ 3 cú pháp:',
            '  ?survey_key=1,2,3  (chuỗi phân tách dấu phẩy)',
            '  ?survey_key=1&survey_key=2  (lặp lại tham số)',
            '  ?survey_key=5  (đơn lẻ)',
          ].join(' '),
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'survey_key',
              in: 'query',
              required: false,
              schema: { type: 'string' },
              description: 'ID (hoặc danh sách ID cách dấu phẩy) của cuộc khảo sát. Bỏ trống = tất cả trong 1 năm. VD: 1,2,3 hoặc lặp ?survey_key=1&survey_key=2',
              example: '1,2',
            },
          ],
          responses: {
            200: {
              description: 'Thành công',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      message: { type: 'string' },
                      data: {
                        type: 'object',
                        properties: {
                          meta: { type: 'object', properties: { surveys: { type: 'array' }, totalFeedbacks: { type: 'integer' } } },
                          overview: {
                            type: 'object',
                            properties: {
                              total: { type: 'integer' },
                              withRating: { type: 'integer' },
                              satisfactionRate: { type: 'number' },
                              averageRating: { type: 'number' },
                              ratingDistribution: { type: 'object' },
                            },
                          },
                          forms: { type: 'array', items: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' }, surveyType: { type: 'string', enum: ['ngoai_tru', 'noi_tru', 'tiem_chung', 'other'] }, overview: { type: 'object' }, trend: { type: 'array' }, sections: { type: 'array' } } } },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
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

      '/api/reports/gsat': {
        get: {
          tags: ['Reports'],
          summary: 'Báo cáo Giám sát y tế (backend-calculated)',
          description: 'Trả về dữ liệu báo cáo đã được tính toán phía backend gồm 3 mục chính (ngoại trú, nội trú, tiêm chủng) và 3 phụ lục. Nếu người dùng được gán vào cơ sở y tế cụ thể (trường `unit`), mục 1/2/3 chỉ hiển thị dữ liệu của cơ sở đó.',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'survey_key', in: 'query', schema: { type: 'string' }, description: 'ID cuộc khảo sát (Survey.id). Nếu không truyền → lấy survey evaluate mới nhất đang active.' },
          ],
          responses: {
            200: {
              description: 'Thành công',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'object',
                        properties: {
                          dataNgoaiTru:  { type: 'array', description: 'Mục 1: Người bệnh ngoại trú' },
                          dataNoiTru:    { type: 'array', description: 'Mục 2: Người bệnh nội trú' },
                          dataTiemChung: { type: 'array', description: 'Mục 3: Dịch vụ tiêm chủng' },
                          dataPhuLuc1:   { type: 'array', description: 'Phụ lục 1: BV công lập' },
                          dataPhuLuc2:   { type: 'array', description: 'Phụ lục 2: BV ngoài công lập' },
                          dataPhuLuc3:   { type: 'array', description: 'Phụ lục 3: Trạm Y tế theo xã/phường' },
                          meta: {
                            type: 'object',
                            properties: {
                              isSingleUnit: { type: 'boolean' },
                              userUnit: { type: 'object', nullable: true },
                              totalFeedbacks: { type: 'integer' },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            401: { description: 'Chưa xác thực' },
            403: { description: 'Không có quyền truy cập' },
          },
        },
      },

      // ══════════════════════════════════════════════════════════
      //  ROLES
      // ══════════════════════════════════════════════════════════
      '/api/roles': {
        get: {
          tags: ['Roles'], summary: 'Danh sách roles', security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'search', in: 'query', schema: { type: 'string' } },
            { name: 'is_active', in: 'query', schema: { type: 'boolean' } },
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
          ],
          responses: { 200: { description: 'Thành công' } },
        },
        post: {
          tags: ['Roles'], summary: 'Tạo role mới', security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RoleInput' } } },
          },
          responses: { 201: { description: 'Tạo thành công' }, 409: { description: 'Role đã tồn tại' } },
        },
      },
      '/api/roles/assign-user': {
        put: {
          tags: ['Roles'], summary: 'Gán / hủy gán 1 hoặc nhiều roles cho user', security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['user_id'],
                  properties: {
                    user_id: { type: 'integer', example: 5 },
                    role_ids: {
                      type: 'array',
                      items: { type: 'integer' },
                      example: [1, 2],
                      nullable: true,
                      description: 'Mảng role id. [] hoặc null để hủy toàn bộ. Ưu tiên hơn role_id.',
                    },
                    role_id: {
                      type: 'integer',
                      example: 2,
                      nullable: true,
                      description: '[Legacy] Gán 1 role duy nhất. Dùng role_ids thay thế.',
                    },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Thành công' }, 404: { description: 'User hoặc role không tồn tại' } },
        },
      },
      '/api/roles/user/{userId}/permissions': {
        get: {
          tags: ['Roles'], summary: 'Xem quyền hiệu lực của user (role + cá nhân)', security: [{ bearerAuth: [] }],
          parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'Trả về danh sách permissions hiệu lực' } },
        },
      },
      '/api/roles/{id}': {
        get: {
          tags: ['Roles'], summary: 'Chi tiết role', security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'Thành công' }, 404: { description: 'Không tìm thấy' } },
        },
        put: {
          tags: ['Roles'], summary: 'Cập nhật role', security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RoleInput' } } },
          },
          responses: { 200: { description: 'Cập nhật thành công' } },
        },
        delete: {
          tags: ['Roles'], summary: 'Xóa role', security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'Xóa thành công' } },
        },
      },
      '/api/roles/{id}/permissions': {
        put: {
          tags: ['Roles'], summary: 'Gán permissions cho role (thay thế toàn bộ)', security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    permission_ids: { type: 'array', items: { type: 'integer' }, example: [1, 2, 3] },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Cập nhật permissions thành công' } },
        },
      },

      // ══════════════════════════════════════════════════════════
      //  TRADING FACILITIES — cơ sở bán buôn, bán lẻ
      // ══════════════════════════════════════════════════════════
      '/api/trading-facilities': {
        get: {
          tags: ['Trading Facilities'],
          summary: 'Danh sách cơ sở bán buôn / bán lẻ',
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
            { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Tìm theo tên, giấy CN, địa chỉ, người phụ trách' },
            { name: 'trading_type', in: 'query', schema: { type: 'string', enum: ['wholesale', 'retail'] }, description: 'wholesale = bán buôn | retail = bán lẻ' },
            { name: 'facility_type', in: 'query', schema: { type: 'string' }, description: 'Loại hình (Nhà thuốc, Quầy thuốc, ...)' },
            { name: 'is_active', in: 'query', schema: { type: 'boolean' } },
            { name: 'sort_by', in: 'query', schema: { type: 'string', default: 'id' } },
            { name: 'sort_order', in: 'query', schema: { type: 'string', enum: ['ASC', 'DESC'], default: 'ASC' } },
          ],
          responses: {
            200: {
              description: 'Thành công',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: { type: 'array', items: { $ref: '#/components/schemas/TradingFacility' } },
                      pagination: { $ref: '#/components/schemas/PaginationMeta' },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ['Trading Facilities'],
          summary: 'Tạo mới cơ sở',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TradingFacilityInput' },
              },
            },
          },
          responses: {
            201: { description: 'Tạo thành công' },
            400: { description: 'Dữ liệu không hợp lệ' },
            401: { description: 'Chưa xác thực' },
          },
        },
      },
      '/api/trading-facilities/stats': {
        get: {
          tags: ['Trading Facilities'],
          summary: 'Thống kê cơ sở bán buôn / bán lẻ',
          responses: {
            200: {
              description: 'Thành công',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'object',
                        properties: {
                          total: { type: 'integer' },
                          wholesale: { type: 'integer' },
                          retail: { type: 'integer' },
                          active: { type: 'integer' },
                          inactive: { type: 'integer' },
                          byType: { type: 'array', items: { type: 'object' } },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/trading-facilities/{id}': {
        get: {
          tags: ['Trading Facilities'],
          summary: 'Chi tiết cơ sở',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
          ],
          responses: {
            200: { description: 'Thành công' },
            404: { description: 'Không tìm thấy' },
          },
        },
        put: {
          tags: ['Trading Facilities'],
          summary: 'Cập nhật cơ sở',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TradingFacilityInput' },
              },
            },
          },
          responses: {
            200: { description: 'Cập nhật thành công' },
            404: { description: 'Không tìm thấy' },
          },
        },
        delete: {
          tags: ['Trading Facilities'],
          summary: 'Xóa cơ sở',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
          ],
          responses: {
            200: { description: 'Xóa thành công' },
            404: { description: 'Không tìm thấy' },
          },
        },
      },

      // ══════════════════════════════════════════════════════════
      //  BANNERS
      // ══════════════════════════════════════════════════════════
      '/api/banners': {
        get: {
          tags: ['Banners'],
          summary: 'Lấy danh sách banner (public)',
          description: 'Trả về tất cả banner, nhóm theo position. Có thể lọc theo position hoặc is_active.',
          parameters: [
            {
              name: 'position',
              in: 'query',
              schema: { type: 'string', enum: ['top', 'left', 'right', 'footer'] },
              description: 'Lọc theo vị trí banner',
            },
            {
              name: 'is_active',
              in: 'query',
              schema: { type: 'boolean' },
              description: 'Lọc theo trạng thái kích hoạt',
            },
          ],
          responses: {
            200: {
              description: 'Thành công',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string' },
                      data: { type: 'array', items: { $ref: '#/components/schemas/Banner' } },
                      grouped: {
                        type: 'object',
                        properties: {
                          top:    { type: 'array', items: { $ref: '#/components/schemas/Banner' } },
                          left:   { type: 'array', items: { $ref: '#/components/schemas/Banner' } },
                          right:  { type: 'array', items: { $ref: '#/components/schemas/Banner' } },
                          footer: { type: 'array', items: { $ref: '#/components/schemas/Banner' } },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ['Banners'],
          summary: 'Tạo banner mới',
          description: [
            'Hỗ trợ 3 cách:',
            '1. **Upload 1 ảnh**: `multipart/form-data` với field `file`',
            '2. **Upload nhiều ảnh**: `multipart/form-data` với field `files[]` (tối đa 20 file, mỗi file ≤ 10MB)',
            '3. **JSON**: `{ position, image_url, title?, link_url?, sort_order? }` hoặc `{ items: [...] }` để tạo nhiều cùng lúc',
          ].join('\n\n'),
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  required: ['position'],
                  properties: {
                    file:       { type: 'string', format: 'binary', description: 'Upload 1 ảnh (field: file)' },
                    files:      { type: 'array', items: { type: 'string', format: 'binary' }, description: 'Upload nhiều ảnh (field: files[]), tối đa 20 file' },
                    position:   { type: 'string', enum: ['top', 'left', 'right', 'footer'] },
                    title:      { type: 'string' },
                    link_url:   { type: 'string' },
                    sort_order: { type: 'integer', default: 0 },
                    is_active:  { type: 'string', enum: ['true', 'false'], default: 'true' },
                  },
                },
              },
              'application/json': {
                schema: {
                  oneOf: [
                    {
                      title: 'Tạo 1 banner',
                      allOf: [{ $ref: '#/components/schemas/BannerInput' }],
                    },
                    {
                      title: 'Tạo nhiều banner',
                      type: 'object',
                      required: ['items'],
                      properties: {
                        items: { type: 'array', items: { $ref: '#/components/schemas/BannerInput' }, description: 'Danh sách banner cần tạo' },
                      },
                    },
                  ],
                },
              },
            },
          },
          responses: {
            201: {
              description: 'Tạo thành công',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      message: { type: 'string', example: 'Tạo 2 banner thành công' },
                      data: { type: 'array', items: { $ref: '#/components/schemas/Banner' } },
                    },
                  },
                },
              },
            },
            400: { description: 'Dữ liệu không hợp lệ (thiếu position hoặc image_url)' },
            401: { description: 'Chưa xác thực' },
            403: { description: 'Không có quyền' },
          },
        },
      },
      '/api/banners/reorder': {
        patch: {
          tags: ['Banners'],
          summary: 'Sắp xếp lại thứ tự banner',
          description: 'Cập nhật sort_order cho nhiều banner cùng lúc. Dùng để kéo thả sắp xếp.',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    required: ['id', 'sort_order'],
                    properties: {
                      id:         { type: 'integer', example: 1 },
                      sort_order: { type: 'integer', example: 0 },
                    },
                  },
                  example: [{ id: 1, sort_order: 0 }, { id: 3, sort_order: 1 }, { id: 2, sort_order: 2 }],
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Sắp xếp thành công',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: { type: 'object', properties: { updated: { type: 'integer', example: 3 } } },
                    },
                  },
                },
              },
            },
            401: { description: 'Chưa xác thực' },
          },
        },
      },
      '/api/banners/{id}': {
        get: {
          tags: ['Banners'],
          summary: 'Chi tiết banner (public)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: {
            200: { description: 'Thành công', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/Banner' } } } } } },
            404: { description: 'Không tìm thấy banner' },
          },
        },
        put: {
          tags: ['Banners'],
          summary: 'Cập nhật banner',
          description: 'Hỗ trợ `application/json` hoặc `multipart/form-data` (khi muốn đổi ảnh mới từ local).',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: {
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    file:       { type: 'string', format: 'binary', description: 'Ảnh mới (tuỳ chọn)' },
                    position:   { type: 'string', enum: ['top', 'left', 'right', 'footer'] },
                    title:      { type: 'string' },
                    link_url:   { type: 'string' },
                    sort_order: { type: 'integer' },
                    is_active:  { type: 'string', enum: ['true', 'false'] },
                  },
                },
              },
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    position:   { type: 'string', enum: ['top', 'left', 'right', 'footer'] },
                    image_url:  { type: 'string', format: 'uri' },
                    title:      { type: 'string' },
                    link_url:   { type: 'string' },
                    sort_order: { type: 'integer' },
                    is_active:  { type: 'boolean' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Cập nhật thành công', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/Banner' } } } } } },
            404: { description: 'Không tìm thấy banner' },
          },
        },
        delete: {
          tags: ['Banners'],
          summary: 'Xóa banner',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: {
            200: { description: 'Xóa thành công' },
            404: { description: 'Không tìm thấy banner' },
          },
        },
      },

      // ══════════════════════════════════════════════════════════
      //  DATASETS
      // ══════════════════════════════════════════════════════════
      '/api/datasets': {
        get: {
          tags: ['Datasets'],
          summary: 'Lấy danh sách tất cả datasets',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Thành công', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: { $ref: '#/components/schemas/DatasetType' } } } } } } } },
        },
        post: {
          tags: ['Datasets'],
          summary: 'Tạo dataset mới',
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/DatasetTypeInput' } } } },
          responses: {
            201: { description: 'Tạo thành công' },
            409: { description: 'code đã tồn tại' },
          },
        },
      },
      '/api/datasets/stats': {
        get: {
          tags: ['Datasets'],
          summary: 'Thống kê toàn hệ thống dataset',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Thành công' } },
        },
      },
      '/api/datasets/{code}': {
        get: {
          tags: ['Datasets'],
          summary: 'Lấy thông tin một dataset',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'code', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Thành công', content: { 'application/json': { schema: { $ref: '#/components/schemas/DatasetType' } } } }, 404: { description: 'Không tìm thấy' } },
        },
        put: {
          tags: ['Datasets'],
          summary: 'Cập nhật thông tin dataset',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'code', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/DatasetTypeInput' } } } },
          responses: { 200: { description: 'Cập nhật thành công' } },
        },
        delete: {
          tags: ['Datasets'],
          summary: 'Xóa dataset (và toàn bộ records)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'code', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 204: { description: 'Đã xóa' } },
        },
      },
      '/api/datasets/{code}/records': {
        get: {
          tags: ['Datasets'],
          summary: 'Lấy danh sách bản ghi (có phân trang, lọc, tìm kiếm)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'code',     in: 'path',  required: true, schema: { type: 'string' } },
            { name: 'page',     in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit',    in: 'query', schema: { type: 'integer', default: 20 } },
            { name: 'search',   in: 'query', schema: { type: 'string' }, description: 'Full-text search trên toàn bộ data JSONB' },
            { name: 'sort_by',  in: 'query', schema: { type: 'string', enum: ['id', 'created_at', 'updated_at'], default: 'id' } },
            { name: 'sort_dir', in: 'query', schema: { type: 'string', enum: ['ASC', 'DESC'], default: 'ASC' } },
            { name: 'filter',   in: 'query', schema: { type: 'string' }, description: 'JSON string: {"field":{"gte":1,"lte":10}} hoặc {"field":"value"}' },
          ],
          responses: { 200: { description: 'Thành công' } },
        },
        post: {
          tags: ['Datasets'],
          summary: 'Tạo một bản ghi mới',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'code', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'object' } }, description: 'Truyền trực tiếp object hoặc wrap trong { data: {...} }' } } } },
          responses: { 201: { description: 'Tạo thành công' } },
        },
        delete: {
          tags: ['Datasets'],
          summary: 'Xóa toàn bộ bản ghi của dataset (truncate)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'code', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Đã xóa' } },
        },
      },
      '/api/datasets/{code}/records/{id}': {
        get: {
          tags: ['Datasets'],
          summary: 'Lấy một bản ghi theo ID',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'code', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'id',   in: 'path', required: true, schema: { type: 'integer' } },
          ],
          responses: { 200: { description: 'Thành công' }, 404: { description: 'Không tìm thấy' } },
        },
        put: {
          tags: ['Datasets'],
          summary: 'Thay thế toàn bộ data của bản ghi',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'code', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'id',   in: 'path', required: true, schema: { type: 'integer' } },
          ],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
          responses: { 200: { description: 'Cập nhật thành công' } },
        },
        patch: {
          tags: ['Datasets'],
          summary: 'Merge (patch) một số field vào bản ghi',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'code', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'id',   in: 'path', required: true, schema: { type: 'integer' } },
          ],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
          responses: { 200: { description: 'Patch thành công' } },
        },
        delete: {
          tags: ['Datasets'],
          summary: 'Xóa một bản ghi',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'code', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'id',   in: 'path', required: true, schema: { type: 'integer' } },
          ],
          responses: { 204: { description: 'Đã xóa' } },
        },
      },
      '/api/datasets/{code}/fields': {
        get: {
          tags: ['Datasets'],
          summary: 'Lấy field definitions của dataset',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'code', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Thành công' } },
        },
        put: {
          tags: ['Datasets'],
          summary: 'Cập nhật / merge field definitions',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'code', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/FieldDef' } } } } },
          responses: { 200: { description: 'Thành công' } },
        },
      },
      '/api/datasets/{code}/fields/detect': {
        post: {
          tags: ['Datasets'],
          summary: 'Tự động phát hiện kiểu dữ liệu từ records hiện có',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'code', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Detect thành công' } },
        },
      },
      '/api/datasets/{code}/fields/{field}/values': {
        get: {
          tags: ['Datasets'],
          summary: 'Lấy các giá trị distinct của một field (dùng cho dropdown)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'code',   in: 'path',  required: true, schema: { type: 'string' } },
            { name: 'field',  in: 'path',  required: true, schema: { type: 'string' } },
            { name: 'limit',  in: 'query', schema: { type: 'integer', default: 100 } },
            { name: 'search', in: 'query', schema: { type: 'string' } },
          ],
          responses: { 200: { description: 'Thành công' } },
        },
      },
      '/api/datasets/{code}/import': {
        post: {
          tags: ['Datasets'],
          summary: 'Import dữ liệu từ file Excel (.xlsx/.xls)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'code',        in: 'path',  required: true, schema: { type: 'string' } },
            { name: 'sheet_index', in: 'query', schema: { type: 'integer', default: 0 }, description: 'Index sheet (0-based)' },
            { name: 'truncate',    in: 'query', schema: { type: 'boolean', default: false }, description: 'Xóa dữ liệu cũ trước khi import' },
          ],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  required: ['file'],
                  properties: {
                    file: { type: 'string', format: 'binary', description: 'File Excel (.xls/.xlsx)' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Import thành công', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'object', properties: { dataset: { type: 'string' }, inserted: { type: 'integer' }, truncated: { type: 'boolean' } } } } } } } },
            400: { description: 'Thiếu file hoặc file không hợp lệ' },
          },
        },
      },
      '/api/datasets/{code}/export': {
        get: {
          tags: ['Datasets'],
          summary: 'Xuất dữ liệu ra file Excel',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'code', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'File Excel', content: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { schema: { type: 'string', format: 'binary' } } } },
            404: { description: 'Không có dữ liệu' },
          },
        },
      },
      '/api/datasets/{code}/stats': {
        get: {
          tags: ['Datasets'],
          summary: 'Thống kê phân phối dữ liệu theo từng field enum',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'code', in: 'path', required: true, schema: { type: 'string' } }],
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
