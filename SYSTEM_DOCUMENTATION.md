# Feedback System Pro - System Documentation

## Table of Contents

1. [System Overview](#1-system-overview)
2. [System Architecture](#2-system-architecture)
3. [Backend Modules](#3-backend-modules)
4. [Frontend Modules](#4-frontend-modules)
5. [Chrome Extension Module](#5-chrome-extension-module)
6. [API Reference](#6-api-reference)
7. [Database Schema](#7-database-schema)
8. [External Integrations](#8-external-integrations)

---

## 1. System Overview

**Feedback System Pro** is a comprehensive customer feedback management and analytics platform that integrates AI to help businesses understand customers automatically and professionally.

### 1.1 Core Capabilities

| Capability | Description |
|------------|-------------|
| **AI-Powered Analysis** | Uses Google Gemini AI and PhoBERT for sentiment analysis and root cause extraction |
| **Background Processing** | Celery & Redis queue system for handling large CSV imports without blocking |
| **Multi-Channel Alerts** | Telegram and Email notifications for negative feedback detection |
| **Web Scraping** | Chrome Extension for collecting data from social platforms (TikTok, Facebook, Shopee) |
| **Real-time Dashboard** | Visual analytics for sentiment trends, keywords, and emerging issues |
| **System Monitoring** | Flower integration for Celery task management |

### 1.2 Technology Stack

**Backend:**
- Framework: FastAPI (Python 3.11+)
- Database: PostgreSQL with SQLAlchemy ORM
- Task Queue: Celery & Redis
- AI Services: Google Generative AI (Gemini 2.5 Flash), PhoBERT (Vietnamese sentiment model)
- Migrations: Alembic

**Frontend:**
- Framework: Next.js 15+ (App Router)
- Language: TypeScript
- Styling: Tailwind CSS
- Charts: Chart.js, Recharts, react-tagcloud

**Infrastructure:**
- Containerization: Docker & Docker Compose (PostgreSQL, Redis)
- Monitoring: Flower (Celery Dashboard)
- Email Service: Resend SDK

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                   │
├─────────────────────┬─────────────────────┬─────────────────────────────┤
│   Next.js Frontend  │   Chrome Extension  │      Telegram Bot           │
│   (Port 3000)       │   (Scraper)         │      (Notifications)        │
└─────────┬───────────┴──────────┬──────────┴──────────────┬──────────────┘
          │                      │                          │
          │ HTTP/REST API        │ HTTP/REST API            │ HTTP API
          ▼                      ▼                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         API GATEWAY LAYER                                │
│                        FastAPI (Port 8000)                               │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    API v1 Endpoints                               │   │
│  │  /auth  /feedbacks  /dashboard  /monitor  /chat  /customers      │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       APPLICATION LAYER                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │   Services   │  │   Schemas    │  │    Core      │  │   Models    │ │
│  │  (Business   │  │  (Pydantic   │  │  (Config,    │  │ (SQLAlchemy │ │
│  │   Logic)     │  │   Validation)│  │   Security)  │  │   ORM)      │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        TASK QUEUE LAYER                                  │
│                    Celery Worker + Redis Broker                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  Tasks: CSV Import, Batch Import, Email Sending, AI Processing   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                          │                                                │
│                          ▼                                                │
│              ┌───────────────────────┐                                   │
│              │  Flower (Port 5555)   │  (Monitoring Dashboard)           │
│              └───────────────────────┘                                   │
└─────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         DATA LAYER                                       │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐  │
│  │   PostgreSQL     │  │     Redis        │  │   External APIs      │  │
│  │   (Port 5432)    │  │   (Port 6379)    │  │   - Google Gemini    │  │
│  │   - Feedbacks    │  │   - Task Queue   │  │   - PhoBERT Model    │  │
│  │   - Users        │  │   - Cache        │  │   - Telegram API     │  │
│  │   - Sources      │  │                  │  │   - Resend (Email)   │  │
│  │   - MonitorTasks │  │                  │  │                      │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Backend Modules

### 3.1 Core Module (`app/core/`)

#### 3.1.1 Configuration (`config.py`)
**Purpose:** Centralized configuration management using Pydantic Settings.

**Features:**
- Environment-based configuration loading from `.env` file
- Database connection string management
- External API keys (Gemini, Telegram, Resend)
- JWT security settings (secret key, expiration)
- CORS origin configuration
- Rate limiting settings

**Key Settings:**
```python
- PROJECT_NAME: "Feedback System Pro"
- API_V1_PREFIX: "/api/v1"
- DATABASE_URL: PostgreSQL connection string
- GEMINI_API_KEY: Google AI API key
- TELEGRAM_BOT_TOKEN: Telegram bot authentication
- RESEND_API_KEY: Email service API key
- SECRET_KEY: JWT signing key (min 32 chars)
- ACCESS_TOKEN_EXPIRE_MINUTES: 30
- REFRESH_TOKEN_EXPIRE_DAYS: 7
```

#### 3.1.2 Celery Configuration (`celery_config.py`)
**Purpose:** Task queue setup for background processing.

**Features:**
- Redis broker/backend configuration
- Task serialization (JSON)
- Timezone: Asia/Ho_Chi_Minh
- Task time limits (5 min hard, 4 min soft)
- Result expiration (1 hour)
- Monitoring integration (Flower)
- Periodic task scheduling support (crontab)

**Configuration:**
```python
- task_track_started: True
- task_time_limit: 300 seconds
- task_acks_late: True
- worker_prefetch_multiplier: 1
- result_extended: True
```

#### 3.1.3 Security (`security.py`)
**Purpose:** Authentication and authorization utilities.

**Features:**
- Password hashing with bcrypt
- JWT access token creation/verification
- JWT refresh token management
- Token expiration handling

**Functions:**
- `hash_password(password)`: Hash password with bcrypt
- `verify_password(plain, hashed)`: Verify password against hash
- `create_access_token(data, expires_delta)`: Generate JWT access token
- `create_refresh_token(data)`: Generate refresh token
- `verify_access_token(token)`: Validate access token
- `verify_refresh_token(token)`: Validate refresh token

#### 3.1.4 Dependencies (`dependencies.py`)
**Purpose:** FastAPI dependency injection for routes.

**Features:**
- Database session management
- Current user authentication (required)
- Current user authentication (optional)
- Token-based user resolution

**Dependencies:**
- `get_db()`: Yield database session
- `get_current_user()`: Require authenticated user
- `get_current_user_optional()`: Allow anonymous access

#### 3.1.5 Logging (`logging.py`)
**Purpose:** Centralized logging configuration.

**Features:**
- Console and file logging
- Log level configuration
- Structured log format
- Module-specific loggers

#### 3.1.6 Exceptions (`exceptions.py`)
**Purpose:** Global exception handling.

**Features:**
- Custom exception classes
- HTTP exception handlers
- Error response formatting
- Stack trace logging

---

### 3.2 Database Module (`app/db/`)

#### 3.2.1 Base Model (`base.py`)
**Purpose:** SQLAlchemy base class for all models.

#### 3.2.2 Session Management (`session.py`)
**Purpose:** Database engine and session factory.

**Features:**
- PostgreSQL connection pooling
- SessionLocal factory for dependency injection

#### 3.2.3 Database Initialization (`init_db.py`)
**Purpose:** Seed initial data on startup.

**Features:**
- Source data seeding (Facebook, Shopee, TikTok, Other)
- Default admin user creation

---

### 3.3 Models Module (`app/models/`)

#### 3.3.1 User Model (`user.py`)
**Purpose:** User authentication and profile management.

**Fields:**
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| username | String | Unique username (indexed) |
| email | String | Unique email (indexed) |
| hashed_password | String | Bcrypt hashed password |
| full_name | String | Optional display name |
| is_active | Boolean | Account status |
| is_superuser | Boolean | Admin privileges |
| created_at | DateTime | Registration timestamp |
| last_login | DateTime | Last login timestamp |

**Relationships:**
- `feedbacks`: One-to-many with Feedback (created_by)

#### 3.3.2 Source Model (`source.py`)
**Purpose:** Data source/platform tracking.

**Fields:**
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| name | String | Display name |
| platform | String | Platform identifier (FACEBOOK, SHOPEE, TIKTOK, OTHER) |

**Relationships:**
- `feedbacks`: One-to-many with Feedback

#### 3.3.3 Feedback Model (`feedback.py`)
**Purpose:** Customer feedback storage.

**Fields:**
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| source_id | UUID | Foreign key to Source |
| created_by | UUID | Foreign key to User |
| raw_content | Text | Original feedback text |
| customer_info | JSONB | Metadata (name, likes, timestamp, etc.) |
| status | String | Processing status (PENDING, PROCESSED, NEEDS_REVIEW) |
| received_at | DateTime | Feedback timestamp |

**Relationships:**
- `source`: Many-to-one with Source
- `analysis`: One-to-one with AnalysisResult
- `creator`: Many-to-one with User

#### 3.3.4 AnalysisResult Model (`feedback.py`)
**Purpose:** AI analysis results storage.

**Fields:**
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| feedback_id | UUID | Foreign key (unique) |
| sentiment_score | Float | Sentiment score (-1.0 to 1.0) |
| sentiment_label | String | POSITIVE, NEGATIVE, NEUTRAL |
| category | String | Root cause category |
| keywords | ARRAY(String) | Extracted keywords |
| confidence | Float | Model confidence (0.0-1.0) |
| is_manual_override | Boolean | Manual correction flag |
| gemini_label | String | Gemini verification result |

**Relationships:**
- `feedback`: One-to-one with Feedback

#### 3.3.5 MonitorTask Model (`monitor.py`)
**Purpose:** Automated monitoring task tracking.

**Fields:**
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| created_by | UUID | Foreign key to User |
| url | String | Target URL to monitor |
| platform | String | Platform type |
| status | String | ACTIVE, PAUSED, ERROR |
| memo | String | User notes |
| is_active | Boolean | Active status |
| last_checked_at | DateTime | Last scan timestamp |
| last_comment_count | Integer | Last known comment count |
| created_at | DateTime | Creation timestamp |

**Relationships:**
- `creator`: Many-to-one with User

---

### 3.4 Schemas Module (`app/schemas/`)

#### 3.4.1 Auth Schemas (`auth.py`)
**Purpose:** Authentication request/response validation.

**Schemas:**
- `UserCreate`: Registration payload (username, email, password, full_name)
- `UserLogin`: Login payload (username, password)
- `TokenResponse`: JWT token response (access_token, refresh_token, expires_in)
- `UserResponse`: User profile response
- `UserUpdate`: Profile update payload
- `ChangePasswordRequest`: Password change payload
- `RefreshTokenRequest`: Token refresh payload

#### 3.4.2 Feedback Schemas (`feedback.py`)
**Purpose:** Feedback data validation.

**Schemas:**
- `AnalysisBase`: Analysis result fields
- `FeedbackResponse`: Full feedback with analysis
- `AnalysisUpdate`: Manual sentiment correction
- `ReviewQueueResponse`: Paginated review queue
- `ScrapedItem`: Chrome extension item format
- `ScrapeBatchRequest`: Batch import payload

#### 3.4.3 Dashboard Schemas (`dashboard.py`)
**Purpose:** Dashboard statistics validation.

**Schemas:**
- `DashboardStats`: Total and sentiment counts

#### 3.4.4 Monitor Schemas (`monitor.py`)
**Purpose:** Monitor task validation.

**Schemas:**
- `MonitorTaskCreate`: Create task payload
- `MonitorTaskResponse`: Task details response

#### 3.4.5 Source Schemas (`source.py`)
**Purpose:** Source data validation.

**Schemas:**
- `SourceResponse`: Source details

#### 3.4.6 Customer Schemas (`customer.py`)
**Purpose:** Customer profile validation.

**Schemas:**
- `CustomerProfile`: Customer analytics profile
- `PaginatedCustomerResponse`: Paginated customer list
- `CustomerAnalyzeRequest`: Customer analysis request
- `ChatRequest`: AI chat query

---

### 3.5 Services Module (`app/services/`)

#### 3.5.1 AI Service (`ai_service.py`)
**Purpose:** Sentiment analysis using PhoBERT model.

**Features:**
- PhoBERT Vietnamese sentiment model integration
- Confidence threshold checking (70%)
- Automatic review flagging for low-confidence predictions
- Dynamic keyword extraction via Gemini

**Functions:**
- `analyze_text(text, source)`: Analyze sentiment and extract keywords

**Analysis Output:**
```python
{
    "score": float,       # -1.0 to 1.0
    "label": str,         # POSITIVE/NEGATIVE/NEUTRAL
    "keywords": list,     # Extracted keywords
    "category": str,      # Root cause category
    "confidence": float,  # 0.0 to 1.0
    "needs_review": bool  # Low confidence flag
}
```

#### 3.5.2 Gemini Service (`gemini_service.py`)
**Purpose:** Google Gemini AI integration.

**Features:**
- Keyword and category extraction
- Sentiment verification (second opinion)
- Customer persona analysis
- Data-driven Q&A chatbot
- Response caching for keywords

**Functions:**
- `extract_categories_and_keywords(text)`: Extract category and keywords (cached)
- `verify_sentiment_with_gemini(text, phobert_label)`: Verify sentiment (5s timeout)
- `analyze_customer_persona(customer_name, history)`: Build customer profile
- `ask_gemini_about_data(question, context_data)`: Answer questions about feedback

**Categories:**
- Chất lượng (Quality)
- Giá cả (Price)
- Vận chuyển (Shipping)
- Dịch vụ (Service)
- Thái độ (Attitude)
- Tích cực chung (General Positive)
- Tiêu cực chung (General Negative)
- Chương trình khuyến mãi (Promotions)
- Khác (Other)

#### 3.5.3 Feedback Service (`feedback_service.py`)
**Purpose:** Feedback CRUD and processing logic.

**Features:**
- Feedback creation with automatic AI analysis
- CSV upload processing with platform mapping
- Review queue management
- Manual analysis override
- Negative feedback detection for alerts

**Platform Mapping:**
```python
PLATFORM_MAPPING = {
    "SHOPEE": {
        "content_cols": ["YNedDV", "content", "comment", ...],
        "author_cols": ["InK5kS", "author", "name", ...],
        "time_cols": ["XYk98l", "time", "date", ...],
        "likes_cols": ["shopee-product-rating__like-count", "like"]
    },
    "FACEBOOK": {...},
    "TIKTOK": {...},
    "OTHER": {...}
}
```

**Functions:**
- `create_feedback_with_analysis(...)`: Create feedback with AI analysis
- `get_feedbacks(skip, limit)`: Get feedback list
- `get_review_queue(skip, limit)`: Get items needing review
- `update_analysis_result(feedback_id, new_label)`: Manual correction
- `process_csv_upload(file_contents, platform)`: Process CSV import

#### 3.5.4 Notification Service (`notification_service.py`)
**Purpose:** Real-time Telegram alerts.

**Features:**
- Single negative feedback alerts
- Batch negative feedback summaries
- Async fire-and-forget delivery
- HTML-formatted messages

**Functions:**
- `send_telegram_alert(message)`: Send synchronous alert
- `send_telegram_alert_async(message)`: Send async alert
- `format_negative_feedback_message(...)`: Format single alert
- `format_batch_negative_feedback_message(...)`: Format batch alert

#### 3.5.5 Email Service (`email_service.py`)
**Purpose:** Email notifications via Resend.

**Features:**
- Professional HTML email templates
- Negative feedback alerts
- Import summary reports
- Auto-retry on failure

**Functions:**
- `send_email(to_email, subject, html_content)`: Send email
- `format_negative_alert_html(...)`: Format negative alert email
- `format_import_summary_html(...)`: Format import summary email

#### 3.5.6 Dashboard Service (`dashboard_service.py`)
**Purpose:** Dashboard statistics and analytics.

**Features:**
- Overall statistics calculation
- Keyword frequency analysis (recent 30 days)
- Sentiment trend data for charting
- Sample data fallback for demo

**Functions:**
- `get_stats(db)`: Get total and sentiment counts
- `get_keyword_stats(db, limit, days)`: Get top keywords
- `get_sentiment_trend(db, days)`: Get trend data for charts

#### 3.5.7 Customer Service (`customer_service.py`)
**Purpose:** Customer profile analytics.

**Features:**
- Customer profile aggregation
- Sentiment ratio calculation
- Customer trend classification
- Interaction history retrieval

**Customer Trends:**
- "Fan cứng" (Loyal fan): avg_score > 0.5
- "Khó tính" (Difficult): avg_score < -0.3
- "Trung lập" (Neutral): -0.3 <= avg_score <= 0.5

**Functions:**
- `get_customer_profiles(skip, limit)`: Get paginated profiles
- `get_customer_history(customer_name, limit)`: Get interaction history

#### 3.5.8 Monitor Service (`monitor_service.py`)
**Purpose:** Monitor task management.

**Features:**
- CRUD operations for monitor tasks
- Active/inactive status management
- Last check tracking

**Functions:**
- `get_monitor_tasks(active_only)`: Get task list
- `create_monitor_task(...)`: Create new task
- `update_monitor_task_status(task_id, is_active)`: Toggle status
- `delete_monitor_task(task_id)`: Delete task
- `update_monitor_task_check(task_id, comment_count)`: Update check info

#### 3.5.9 Export Service (`export_service.py`)
**Purpose:** Data export functionality.

**Features:**
- Excel export with formatted columns
- Timestamp-based filename generation
- Source name resolution

**Functions:**
- `export_feedbacks_to_excel(db)`: Generate Excel report

**Export Columns:**
- ID, Nguồn (Source), Thời gian (Time)
- Nội dung gốc (Original Content)
- Người gửi (Sender), Likes
- Cảm xúc (AI) (Sentiment), Điểm số (Score)
- Từ khóa (Keywords)

#### 3.5.10 Source Service (`source_service.py`)
**Purpose:** Source management.

**Functions:**
- `get_sources(db)`: Get all sources
- `get_source_by_platform(db, platform)`: Get by platform

#### 3.5.11 Auth Service (`auth_service.py`)
**Purpose:** User authentication logic.

**Functions:**
- `create_user(user_data)`: Create new user
- `get_user_by_username(username)`: Find by username
- `get_user_by_email(email)`: Find by email
- `get_user_by_id(user_id)`: Find by ID
- `authenticate_user(username, password)`: Validate credentials
- `update_last_login(user_id)`: Update login timestamp

#### 3.5.12 Tasks (`tasks.py`)
**Purpose:** Celery background tasks.

**Tasks:**

**1. process_csv_import_task**
- Process CSV file uploads
- Platform-specific column mapping
- Batch processing with progress updates
- Negative feedback alert batching
- Import summary email

**2. process_batch_import_task**
- Process Chrome Extension imports
- Timestamp parsing
- Duplicate prevention
- Alert batching and summary emails

**3. send_email_task**
- Background email delivery
- Auto-retry on failure (max 3 retries, 60s delay)

---

### 3.6 API Module (`app/api/v1/`)

#### 3.6.1 Health API (`health.py`)
**Endpoints:**
- `GET /health`: System health check

**Response:**
```json
{
    "status": "ok|degraded",
    "environment": "development",
    "database": "healthy|unhealthy"
}
```

#### 3.6.2 Auth API (`auth.py`)
**Endpoints:**
- `POST /auth/register`: Register new user
- `POST /auth/login`: Login and get tokens
- `POST /auth/refresh`: Refresh access token
- `GET /auth/me`: Get current user info
- `PUT /auth/me`: Update current user profile
- `POST /auth/change-password`: Change password

#### 3.6.3 Feedback API (`feedbacks.py`)
**Endpoints:**
- `GET /feedbacks`: Get feedback list (paginated)
- `GET /feedbacks/review-queue`: Get items needing manual review
- `POST /feedbacks/test-create`: Quick test feedback creation
- `POST /feedbacks/upload-csv`: Upload CSV for processing
- `GET /feedbacks/export`: Export feedbacks to Excel
- `PUT /feedbacks/{id}/analysis`: Update analysis (manual override)
- `POST /feedbacks/batch-import`: Import from Chrome Extension

#### 3.6.4 Dashboard API (`dashboard.py`)
**Endpoints:**
- `GET /dashboard/stats`: Get statistics
- `GET /dashboard/keywords`: Get top keywords
- `GET /dashboard/trend`: Get sentiment trend data

#### 3.6.5 Monitor API (`monitor.py`)
**Endpoints:**
- `POST /monitor`: Add monitoring task
- `GET /monitor`: Get active tasks
- `DELETE /monitor/{id}`: Delete task

#### 3.6.6 Chat API (`chat.py`)
**Endpoints:**
- `POST /chat/ask`: Ask AI about feedback data

#### 3.6.7 Customers API (`customers.py`)
**Endpoints:**
- `GET /customers`: Get customer profiles (paginated)
- `POST /customers/analyze-profile`: Analyze customer persona with AI

#### 3.6.8 Sources API (`sources.py`)
**Endpoints:**
- `GET /sources`: Get available sources (public)

#### 3.6.9 Tasks API (`tasks.py`)
**Endpoints:**
- `GET /tasks/{task_id}`: Get Celery task status

---

## 4. Frontend Modules

### 4.1 Application Structure (`app/`)

#### 4.1.1 Marketing Layout (`(marketing)/`)
**Purpose:** Landing page and public-facing content.

**Files:**
- `page.tsx`: Home page
- `layout.tsx`: Marketing layout wrapper

#### 4.1.2 Auth Layout (`(auth)/`)
**Purpose:** Authentication pages.

**Sub-routes:**
- `/login`: User login page
- `/register`: User registration page

**Features:**
- Form validation
- Error handling
- JWT token storage
- Protected route redirection

#### 4.1.3 Dashboard Layout (`(dashboard)/`)
**Purpose:** Main application interface.

**Sub-routes:**
- `/dashboard`: Main analytics dashboard
- `/customers`: Customer profiles and analysis

**Features:**
- Protected routes (authentication required)
- Real-time data refresh
- Responsive design

### 4.2 Components

#### 4.2.1 UploadArea (`UploadArea.tsx`)
**Purpose:** CSV file upload interface.

**Features:**
- Drag-and-drop UI
- Platform selection (Facebook, Shopee, TikTok, Other)
- File validation (.csv only)
- Real-time progress tracking via Celery task polling
- Success/error notifications

**State Management:**
- `isUploading`: Upload status
- `progress`: {current, total} for progress bar
- `message`: {type, text} for notifications
- `platform`: Selected data source

**API Integration:**
- `POST /feedbacks/upload-csv`: Upload file
- `GET /tasks/{task_id}`: Poll task status

#### 4.2.2 DashboardStats (`DashboardStats.tsx`)
**Purpose:** Display key metrics and sentiment pie chart.

**Features:**
- Total feedback count
- Positive/Negative counts
- Recharts pie chart visualization
- Color-coded sentiment display

**Data Flow:**
- `GET /dashboard/stats`: Fetch statistics
- Transform data for Recharts format

#### 4.2.3 AnalyticsCharts (`AnalyticsCharts.tsx`)
**Purpose:** Sentiment trend analysis.

**Features:**
- Line chart for sentiment over time
- Doughnut chart for overall distribution
- Time range selector (7, 14, 30, 90, 365 days)
- Empty state handling
- Anti-caching with timestamp

**Charts:**
- **Line Chart:** Positive/Negative trends over dates
- **Doughnut Chart:** Overall sentiment distribution with percentage

**API Integration:**
- `GET /dashboard/trend?days={n}`: Fetch trend data

#### 4.2.4 WordCloudChart (`WordCloudChart.tsx`)
**Purpose:** Keyword visualization.

**Features:**
- Interactive tag cloud
- Click-to-view details
- Recent 30-day keywords
- Empty state fallback

**API Integration:**
- `GET /dashboard/keywords`: Fetch top 15 keywords

#### 4.2.5 FeedbackList (`FeedbackList.tsx`)
**Purpose:** Recent feedback display.

**Features:**
- Real-time auto-refresh (10-second interval)
- Sentiment badge (Positive/Negative/Neutral)
- Manual sentiment correction (edit mode)
- "New" badge for recent items (<24 hours)
- Platform identification with icons
- Customer metadata display (name, likes)
- Timestamp formatting (Vietnamese locale)

**API Integration:**
- `GET /feedbacks`: Fetch feedback list
- `GET /sources`: Fetch source list
- `PUT /feedbacks/{id}/analysis`: Update sentiment

#### 4.2.6 MonitorManager (`MonitorManager.tsx`)
**Purpose:** Automated monitoring configuration.

**Features:**
- Add monitoring URL
- Auto-detect platform from URL
- Memo/notes for each task
- Active task list with platform icons
- Delete functionality
- Status indicator (RUNNING)

**Platform Detection:**
- Facebook: URL contains "facebook.com"
- Shopee: URL contains "shopee.vn" or "shopee"
- TikTok: URL contains "tiktok.com"

**API Integration:**
- `POST /monitor`: Add task
- `GET /monitor`: Fetch tasks
- `DELETE /monitor/{id}`: Delete task

#### 4.2.7 ChatWidget (`ChatWidget.tsx`)
**Purpose:** AI-powered chatbot for data analysis.

**Features:**
- Floating action button
- Suggested questions (randomized)
- Markdown rendering for AI responses
- Loading indicators
- Auto-scroll to latest message
- Sample question bank

**Sample Questions:**
- "Khách hàng đang phàn nàn về vấn đề gì nhiều nhất?"
- "Tóm tắt các điểm mạnh và điểm yếu của shop trong tuần qua."
- "Có phát hiện dấu hiệu khách hàng 'bom hàng' hay lừa đảo không?"
- "So sánh thái độ khách hàng giữa Facebook và Shopee."
- "Đề xuất 3 hành động cụ thể để cải thiện CSKH ngay lập tức."

**API Integration:**
- `POST /chat/ask`: Send question to AI

#### 4.2.8 Header (`Header.tsx`)
**Purpose:** Navigation and user menu.

#### 4.2.9 Footer (`Footer.tsx`)
**Purpose:** Footer with branding.

---

## 5. Chrome Extension Module

### 5.1 Extension Architecture

**Files:**
- `manifest.json`: Extension configuration
- `background.js`: Service worker for background tasks
- `content.js`: Content script for DOM interaction
- `inject.js`: Network interceptor for API scraping
- `popup.html`: Extension popup UI
- `popup.js`: Popup logic

### 5.2 Core Features

#### 5.2.1 Manual Scraping
**Trigger:** User clicks "Quét thủ công" button in popup.

**Process:**
1. Popup sends `FORCE_SCRAPE_NOW` message to content script
2. Content script scrapes current page DOM
3. Data sent to background via `SEND_DATA_TO_BACKEND`
4. Background proxies request to backend API
5. Success/error feedback to popup

#### 5.2.2 Automated Patrol (Background Monitoring)
**Trigger:** 
- Automatic: Every 30 minutes via Chrome Alarms API
- Manual: User clicks "Chạy tuần tra" button

**Process:**
1. Background fetches active tasks from `/monitor` endpoint
2. For each task:
   - Open tab in background (inactive)
   - Wait for page load (8-15 seconds based on platform)
   - Send `AUTO_SCROLL_START` message to content script
   - Content script auto-scrolls and scrapes
   - After 25 seconds, close tab
   - Wait 5 seconds before next task
3. Batch send collected data to backend

#### 5.2.3 Platform-Specific Scraping

**Shopee:**
- Method: Network interception (inject.js)
- Hook: `window.fetch` to intercept `get_ratings` API calls
- Data: Ratings, comments, author, timestamp
- DOM fallback: Manual scraping if API fails

**Facebook:**
- Method: DOM scraping
- Selectors: `div[dir="auto"]`, `div[role="article"]`
- Features:
  - Auto-click "Xem thêm", "Phù hợp nhất" buttons
  - Author extraction from span/strong elements
  - Timestamp parsing (Vietnamese format)
  - Like count extraction (multiple strategies)

**TikTok:**
- Method: DOM scraping
- Selectors: `div[data-e2e="comment-level-1"]`, `p[data-e2e="comment-level-1"]`
- Features:
  - Comment text extraction
  - Username extraction
  - Like count parsing (handles "K" suffix)

### 5.3 Data Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Popup UI      │     │  Content Script │     │  Background JS  │
│  (popup.js)     │     │   (content.js)  │     │ (background.js) │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │ 1. FORCE_SCRAPE_NOW   │                       │
         │──────────────────────>│                       │
         │                       │                       │
         │                       │ 2. Scrape DOM/API     │
         │                       │    Collect items      │
         │                       │                       │
         │                       │ 3. SEND_DATA_TO_BACKEND
         │                       │──────────────────────>│
         │                       │                       │
         │                       │                       │ 4. POST /feedbacks/batch-import
         │                       │                       │────────────────> Backend
         │                       │                       │
         │ 5. SCRAPE_DONE        │                       │
         │<──────────────────────│                       │
         │                       │                       │
```

### 5.4 Key Functions

**background.js:**
- `startPatrol()`: Initiate patrol cycle
- `processTask(task)`: Handle single monitoring task
- Message handlers: `FORCE_PATROL`, `SEND_DATA_TO_BACKEND`

**content.js:**
- `startAutoScrollProcess(platform)`: Auto-scroll and scrape
- `finalizeAndSend(isManual)`: Deduplicate and send data
- `scrapeFacebookDOM()`: Facebook-specific scraper
- `scrapeTiktokDOM()`: TikTok-specific scraper
- `parseStrictDate(str)`: Vietnamese date parser

**inject.js:**
- Fetch API interceptor for Shopee
- Posts data to content script via `window.postMessage`

---

## 6. API Reference

### 6.1 Authentication Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/auth/register` | No | Register new user |
| POST | `/api/v1/auth/login` | No | Login and get tokens |
| POST | `/api/v1/auth/refresh` | No | Refresh access token |
| GET | `/api/v1/auth/me` | Yes | Get current user |
| PUT | `/api/v1/auth/me` | Yes | Update profile |
| POST | `/api/v1/auth/change-password` | Yes | Change password |

### 6.2 Feedback Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/feedbacks` | Yes | List feedbacks |
| GET | `/api/v1/feedbacks/review-queue` | Yes | Get items for review |
| POST | `/api/v1/feedbacks/test-create` | Yes | Create test feedback |
| POST | `/api/v1/feedbacks/upload-csv` | Yes | Upload CSV file |
| GET | `/api/v1/feedbacks/export` | Yes | Export to Excel |
| PUT | `/api/v1/feedbacks/{id}/analysis` | Yes | Update analysis |
| POST | `/api/v1/feedbacks/batch-import` | Optional | Import from extension |

### 6.3 Dashboard Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/dashboard/stats` | Yes | Get statistics |
| GET | `/api/v1/dashboard/keywords` | Yes | Get keywords |
| GET | `/api/v1/dashboard/trend` | Yes | Get trend data |

### 6.4 Monitor Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/monitor` | Yes | Add monitor task |
| GET | `/api/v1/monitor` | Optional | List tasks |
| DELETE | `/api/v1/monitor/{id}` | Yes | Delete task |

### 6.5 Other Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/chat/ask` | Yes | Ask AI question |
| GET | `/api/v1/customers` | Yes | List customers |
| POST | `/api/v1/customers/analyze-profile` | Yes | Analyze persona |
| GET | `/api/v1/sources` | No | List sources |
| GET | `/api/v1/tasks/{task_id}` | Yes | Get task status |
| GET | `/health` | No | Health check |

---

## 7. Database Schema

### 7.1 Entity Relationship Diagram

```
┌─────────────────────┐       ┌─────────────────────┐
│       users         │       │       sources       │
├─────────────────────┤       ├─────────────────────┤
│ id (PK)             │       │ id (PK)             │
│ username            │       │ name                │
│ email               │       │ platform            │
│ hashed_password     │       └──────────┬──────────┘
│ full_name           │                  │
│ is_active           │                  │ 1
│ is_superuser        │                  │
│ created_at          │                  │
│ last_login          │                  │
└──────────┬──────────┘                  │
           │ 1                          │
           │                            │
           │ N                          │ N
           │                            │
           ▼                            ▼
┌─────────────────────────────────────────────────┐
│                  feedbacks                      │
├─────────────────────────────────────────────────┤
│ id (PK)                                         │
│ source_id (FK -> sources.id)                    │
│ created_by (FK -> users.id)                     │
│ raw_content                                     │
│ customer_info (JSONB)                           │
│ status                                          │
│ received_at                                     │
└───────────────────────┬─────────────────────────┘
                        │ 1
                        │
                        │ 1
                        │
                        ▼
┌─────────────────────────────────────────────────┐
│              analysis_results                   │
├─────────────────────────────────────────────────┤
│ id (PK)                                         │
│ feedback_id (FK -> feedbacks.id) UNIQUE         │
│ sentiment_score                                 │
│ sentiment_label                                 │
│ category                                        │
│ keywords (ARRAY)                                │
│ confidence                                      │
│ is_manual_override                              │
│ gemini_label                                    │
└─────────────────────────────────────────────────┘

┌─────────────────────┐
│       users         │
├─────────────────────┤
│ id (PK)             │
└──────────┬──────────┘
           │ 1
           │
           │ N
           │
           ▼
┌─────────────────────────────────────────────────┐
│              monitor_tasks                      │
├─────────────────────────────────────────────────┤
│ id (PK)                                         │
│ created_by (FK -> users.id)                     │
│ url                                             │
│ platform                                        │
│ status                                          │
│ memo                                            │
│ is_active                                       │
│ last_checked_at                                 │
│ last_comment_count                              │
│ created_at                                      │
└─────────────────────────────────────────────────┘
```

### 7.2 Table Specifications

#### users
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR UNIQUE NOT NULL,
    email VARCHAR UNIQUE NOT NULL,
    hashed_password VARCHAR NOT NULL,
    full_name VARCHAR,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    is_superuser BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    last_login TIMESTAMP
);
```

#### sources
```sql
CREATE TABLE sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    platform VARCHAR UNIQUE NOT NULL
);

-- Seed data:
-- ('Facebook', 'FACEBOOK')
-- ('Shopee', 'SHOPEE')
-- ('TikTok', 'TIKTOK')
-- ('Khác', 'OTHER')
```

#### feedbacks
```sql
CREATE TABLE feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID REFERENCES sources(id),
    created_by UUID REFERENCES users(id),
    raw_content TEXT NOT NULL,
    customer_info JSONB DEFAULT '{}',
    status VARCHAR DEFAULT 'PENDING',
    received_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_feedbacks_source ON feedbacks(source_id);
CREATE INDEX idx_feedbacks_created_by ON feedbacks(created_by);
CREATE INDEX idx_feedbacks_status ON feedbacks(status);
CREATE INDEX idx_feedbacks_received_at ON feedbacks(received_at);
```

#### analysis_results
```sql
CREATE TABLE analysis_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feedback_id UUID UNIQUE REFERENCES feedbacks(id) NOT NULL,
    sentiment_score FLOAT,
    sentiment_label VARCHAR,
    category VARCHAR,
    keywords VARCHAR[],
    confidence FLOAT,
    is_manual_override BOOLEAN DEFAULT FALSE NOT NULL,
    gemini_label VARCHAR
);

CREATE INDEX idx_analysis_feedback ON analysis_results(feedback_id);
CREATE INDEX idx_analysis_label ON analysis_results(sentiment_label);
```

#### monitor_tasks
```sql
CREATE TABLE monitor_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by UUID REFERENCES users(id),
    url VARCHAR NOT NULL,
    platform VARCHAR NOT NULL,
    status VARCHAR DEFAULT 'ACTIVE',
    memo VARCHAR,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    last_checked_at TIMESTAMP,
    last_comment_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_monitor_created_by ON monitor_tasks(created_by);
CREATE INDEX idx_monitor_active ON monitor_tasks(is_active);
```

---

## 8. External Integrations

### 8.1 Google Gemini AI

**Purpose:** Advanced NLP for keyword extraction, categorization, and chatbot.

**Configuration:**
- Environment: `GEMINI_API_KEY`
- Model: `gemini-2.5-flash`
- Timeout: 5 seconds for verification (non-blocking)

**Use Cases:**
1. **Keyword Extraction:** Dynamic keyword and category extraction from feedback text
2. **Sentiment Verification:** Second opinion for low-confidence PhoBERT predictions
3. **Customer Persona:** Build customer profiles from interaction history
4. **Data Chatbot:** Answer questions about feedback data

**Rate Limiting:**
- Handles 429 errors gracefully
- Falls back to PhoBERT-only mode when rate limited
- Caches keyword extraction results (LRU cache, max 1000 entries)

### 8.2 PhoBERT Model

**Purpose:** Vietnamese sentiment analysis.

**Model:** `wonrax/phobert-base-vietnamese-sentiment`

**Configuration:**
- Confidence threshold: 70%
- Below threshold → flag for review + Gemini verification

**Labels:**
- POS → POSITIVE (score: 0.0 to 1.0)
- NEG → NEGATIVE (score: -1.0 to 0.0)
- NEU → NEUTRAL (score: 0.0)

### 8.3 Telegram Bot API

**Purpose:** Real-time negative feedback alerts.

**Configuration:**
- `TELEGRAM_BOT_TOKEN`: Bot authentication token (from BotFather)
- `TELEGRAM_CHAT_ID`: Target chat/group ID

**Alert Types:**
1. **Single Negative Feedback:** Immediate alert with full details
2. **Batch Negative Feedback:** Compiled summary (up to 3 previews)

**Message Format:** HTML with emojis and formatting

### 8.4 Resend Email API

**Purpose:** Professional email notifications.

**Configuration:**
- `RESEND_API_KEY`: API key from Resend.com
- `FROM_EMAIL`: Sender email (default: onboarding@resend.dev)
- `ADMIN_EMAIL`: Recipient for alerts

**Email Types:**
1. **Negative Feedback Alert:** HTML-formatted alert with action button
2. **Import Summary:** Statistics after CSV/batch import completion

**Retry Logic:**
- Celery task with auto-retry (max 3 retries, 60s countdown)

### 8.5 PostgreSQL Database

**Purpose:** Primary data storage.

**Configuration:**
- Docker container: `postgres:16-alpine`
- Port: 5432 (configurable)
- Health check: `pg_isready` every 10 seconds

**Features:**
- UUID primary keys
- JSONB for flexible metadata
- ARRAY type for keywords
- Indexed queries for performance

### 8.6 Redis

**Purpose:** Celery message broker and result backend.

**Configuration:**
- Docker container: `redis:7-alpine`
- Port: 6379
- URL: `redis://localhost:6379/0`

**Features:**
- Task queue management
- Result storage (1-hour expiration)
- Broker for worker communication

---

## Appendix

### A. Environment Variables

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/customer_feedbacks

# Security
SECRET_KEY=your-super-secret-key-min-32-characters-for-jwt-signing
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# External Services
GEMINI_API_KEY=your_gemini_api_key_here
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_CHAT_ID=your_telegram_chat_id_here
RESEND_API_KEY=your_resend_api_key_here
FROM_EMAIL=onboarding@resend.dev
ADMIN_EMAIL=admin@example.com

# Application
ENVIRONMENT=development
LOG_LEVEL=info
CORS_ORIGINS=http://localhost:3000,http://0.0.0.0:3000
DEFAULT_ADMIN_PASSWORD=admin123
```

### B. Port Configuration

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 3000 | Next.js development server |
| Backend API | 8000 | FastAPI application |
| Flower | 5555 | Celery monitoring dashboard |
| PostgreSQL | 5432 | Database (Docker) |
| Redis | 6379 | Message broker (Docker) |

### C. Key Dependencies

**Backend:**
- fastapi==0.135.1
- sqlalchemy==2.0.48
- celery==5.4.0
- google-genai==1.66.0
- transformers==5.3.0 (PhoBERT)
- redis==5.2.1
- flower==2.0.1
- resend==2.23.0

**Frontend:**
- next==16.1.0
- react==19.2.3
- recharts==3.6.0
- chart.js==4.5.1
- axios==1.13.2
- lucide-react==0.562.0

### D. Running the System

**1. Start Infrastructure (Docker):**
```bash
docker-compose up -d
```

**2. Initialize Database:**
```bash
cd backend
alembic upgrade head
```

**3. Start Backend Services:**
```bash
python run_all.py
# Starts: FastAPI (8000), Celery Worker, Flower (5555)
```

**4. Start Frontend:**
```bash
cd frontend
npm run dev
```

**5. Access Points:**
- Frontend: http://localhost:3000
- API Docs: http://localhost:8000/docs
- Flower Monitor: http://localhost:5555

---

*Documentation generated for Feedback System Pro v5.0*
*Last updated: March 16, 2026*
