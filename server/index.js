import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import OpenAI from 'openai';
import twilio from 'twilio';
import nodemailer from 'nodemailer';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Portu 5173 olarak düzeltin
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Database connection
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'agency_crm',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let db;

// Global settings cache
let globalSettings = {};

// Initialize database
async function initializeDB() {
  try {
    // First connect without database to create it if needed
    const tempConfig = { ...dbConfig };
    delete tempConfig.database;
    
    const tempConnection = await mysql.createConnection(tempConfig);
    await tempConnection.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
    await tempConnection.end();
    
    // Now connect to the database
    db = mysql.createPool(dbConfig);
    await createTables();
    await loadSettings();
    console.log('✅ Database connected and tables created');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    console.log('📋 Please ensure MySQL is running and create the database:');
    console.log(`   CREATE DATABASE ${dbConfig.database};`);
  }
}

// Load settings from database
async function loadSettings() {
  try {
    const [settings] = await db.execute('SELECT * FROM system_settings');
    globalSettings = {};
    settings.forEach(setting => {
      globalSettings[setting.setting_key] = setting.setting_value;
    });
    console.log('✅ Settings loaded from database');
    
    // Initialize services with new settings
    initializeServices();
  } catch (error) {
    console.error('❌ Failed to load settings:', error);
  }
}

// Initialize external services
function initializeServices() {
  initializeOpenAI();
  initializeTwilio();
  initializeEmail();
}

function initializeOpenAI() {
  const apiKey = globalSettings.openai_api_key || process.env.OPENAI_API_KEY;
  if (apiKey && apiKey.trim() !== '') {
    try {
      global.openai = new OpenAI({ apiKey: apiKey.trim() });
      console.log('✅ OpenAI initialized');
    } catch (error) {
      console.error('❌ OpenAI initialization failed:', error.message);
      global.openai = null;
    }
  } else {
    global.openai = null;
    console.log('⚠️ OpenAI API key not configured');
  }
}

function initializeTwilio() {
  const accountSid = globalSettings.twilio_account_sid || process.env.TWILIO_ACCOUNT_SID;
  const authToken = globalSettings.twilio_auth_token || process.env.TWILIO_AUTH_TOKEN;
  
  if (accountSid && authToken) {
    try {
      global.twilioClient = twilio(accountSid, authToken);
      console.log('✅ Twilio initialized');
    } catch (error) {
      console.error('❌ Twilio initialization failed:', error.message);
      global.twilioClient = null;
    }
  } else {
    global.twilioClient = null;
  }
}

function initializeEmail() {
  const smtpHost = globalSettings.smtp_host || process.env.SMTP_HOST;
  const smtpPort = globalSettings.smtp_port || process.env.SMTP_PORT || 587;
  const smtpUser = globalSettings.smtp_user || process.env.SMTP_USER;
  const smtpPass = globalSettings.smtp_pass || process.env.SMTP_PASS;
  
  if (smtpHost && smtpUser && smtpPass) {
    try {
      global.emailTransporter = nodemailer.createTransporter({
        host: smtpHost,
        port: parseInt(smtpPort),
        secure: false,
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      });
      console.log('✅ Email transporter initialized');
    } catch (error) {
      console.error('❌ Email initialization failed:', error.message);
      global.emailTransporter = null;
    }
  } else {
    global.emailTransporter = null;
  }
}

// Create database tables
async function createTables() {
  const tables = [
    `CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role ENUM('admin', 'user') DEFAULT 'user',
      avatar VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    
   `CREATE TABLE IF NOT EXISTS services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  default_price DECIMAL(10,2),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`
    
    `CREATE TABLE IF NOT EXISTS customers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE,
      phone VARCHAR(20),
      company VARCHAR(100),
      instagram VARCHAR(100),
      website VARCHAR(255),
      status ENUM('active', 'inactive', 'potential') DEFAULT 'potential',
      avatar VARCHAR(255),
      last_interaction TIMESTAMP,
      customer_type ENUM('cold', 'warm', 'hot') DEFAULT 'cold',
      potential_budget DECIMAL(10,2),
      sales_difficulty_score INT DEFAULT 5,
      interested_services TEXT,
      ai_analysis_date TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS customer_services (
      id INT AUTO_INCREMENT PRIMARY KEY,
      customer_id INT NOT NULL,
      service_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
      FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
      UNIQUE KEY unique_customer_service (customer_id, service_id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS proposals (
      id INT AUTO_INCREMENT PRIMARY KEY,
      customer_id INT NOT NULL,
      user_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      total_amount DECIMAL(10,2) NOT NULL,
      status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
      valid_until DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    
    `CREATE TABLE IF NOT EXISTS proposal_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      proposal_id INT NOT NULL,
      service_id INT NOT NULL,
      description TEXT,
      quantity INT DEFAULT 1,
      unit_price DECIMAL(10,2) NOT NULL,
      total_price DECIMAL(10,2) NOT NULL,
      FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE,
      FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
    )`,
    
    `CREATE TABLE IF NOT EXISTS expenses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      customer_id INT,
      proposal_id INT,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      amount DECIMAL(10,2) NOT NULL,
      category VARCHAR(100),
      expense_date DATE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
      FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE SET NULL
    )`,
    
    `CREATE TABLE IF NOT EXISTS notes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      customer_id INT NOT NULL,
      user_id INT NOT NULL,
      type ENUM('phone', 'meeting', 'email', 'whatsapp', 'general', 'audio') DEFAULT 'general',
      content TEXT NOT NULL,
      is_transcribed BOOLEAN DEFAULT FALSE,
      audio_file_path VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    
    `CREATE TABLE IF NOT EXISTS meetings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      customer_id INT NOT NULL,
      user_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      start_date DATETIME NOT NULL,
      end_date DATETIME NOT NULL,
      status ENUM('scheduled', 'completed', 'cancelled') DEFAULT 'scheduled',
      notification_sent BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    
    `CREATE TABLE IF NOT EXISTS tasks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      customer_id INT NOT NULL,
      user_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
      status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
      task_type ENUM('manual', 'ai_generated') DEFAULT 'manual',
      due_date DATETIME,
      created_by_ai BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    
    `CREATE TABLE IF NOT EXISTS ai_analysis (
      id INT AUTO_INCREMENT PRIMARY KEY,
      note_id INT NOT NULL,
      sentiment VARCHAR(20),
      priority VARCHAR(20),
      suggestions TEXT,
      next_actions TEXT,
      confidence_score DECIMAL(3,2),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
    )`,
    
    `CREATE TABLE IF NOT EXISTS whatsapp_messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      customer_id INT NOT NULL,
      direction ENUM('inbound', 'outbound') NOT NULL,
      message TEXT NOT NULL,
      status VARCHAR(20),
      phone_number VARCHAR(20),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    )`,
    
    `CREATE TABLE IF NOT EXISTS whatsapp_templates (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      template_type ENUM('first_contact', 'proposal_response', 'thank_you', 'follow_up') NOT NULL,
      content TEXT NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS instagram_analysis (
      id INT AUTO_INCREMENT PRIMARY KEY,
      customer_id INT NOT NULL,
      instagram_handle VARCHAR(100),
      follower_count INT,
      following_count INT,
      post_count INT,
      engagement_rate DECIMAL(5,2),
      last_analysis_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      top_content_type VARCHAR(100),
      analysis_data JSON,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    )`,
    
    `CREATE TABLE IF NOT EXISTS integrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(50) NOT NULL,
      config JSON,
      is_active BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS system_settings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      setting_key VARCHAR(100) UNIQUE NOT NULL,
      setting_value TEXT,
      setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      action VARCHAR(100) NOT NULL,
      details TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )`
  ];

  for (const table of tables) {
    await db.execute(table);
  }

  // Check if customer_type column exists, if not add it
  try {
    const [columns] = await db.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'customers' AND COLUMN_NAME = 'customer_type'
    `, [dbConfig.database]);

    if (columns.length === 0) {
      await db.execute(`
        ALTER TABLE customers 
        ADD COLUMN customer_type ENUM('cold', 'warm', 'hot') DEFAULT 'cold' AFTER status
      `);
      console.log('✅ Added customer_type column to customers table');
    }
  } catch (error) {
    console.error('Error checking/adding customer_type column:', error);
  }

  // Insert default services
 // Insert default services only if the table is empty
  const [servicesExist] = await db.execute('SELECT COUNT(*) as count FROM services');

  if (servicesExist[0].count === 0) {
    console.log('Hizmetler tablosu boş, varsayılan hizmetler ekleniyor...');
    
    const defaultServices = [
      ['Web Tasarım', 'Modern ve responsive web sitesi tasarımı', 5000.00],
      ['Sosyal Medya Yönetimi', 'Sosyal medya hesaplarının profesyonel yönetimi', 2000.00],
      ['SEO', 'Arama motoru optimizasyonu hizmetleri', 3000.00],
      ['E-Ticaret', 'E-ticaret sitesi kurulumu ve yönetimi', 8000.00],
      ['Grafik Tasarım', 'Profesyonel grafik tasarım hizmetleri', 1500.00],
      ['Logo Tasarım', 'Kurumsal kimlik ve logo tasarımı', 1000.00],
      ['Google Reklam', 'Google Ads kampanya yönetimi', 2500.00],
      ['Meta Reklam', 'Facebook ve Instagram reklam yönetimi', 2500.00],
      ['Marka Danışmanlığı', 'Marka stratejisi ve danışmanlık hizmetleri', 4000.00]
    ];

    for (const service of defaultServices) {
      await db.execute(
        'INSERT INTO services (name, description, default_price) VALUES (?, ?, ?)',
        service
      );
    }
    console.log('Varsayılan hizmetler başarıyla eklendi.');
  }
  // Insert default WhatsApp templates
  const defaultTemplates = [
    ['İlk Temas', 'first_contact', 'Merhaba! {customer_name}, dijital ajansımız hakkında bilgi almak istediğinizi öğrendik. Size nasıl yardımcı olabiliriz?'],
    ['Teklif Yanıtı', 'proposal_response', 'Merhaba {customer_name}, talebiniz doğrultusunda hazırladığımız teklifi incelemenizi rica ederiz. Sorularınız için bize ulaşabilirsiniz.'],
    ['Teşekkür Mesajı', 'thank_you', 'Merhaba {customer_name}, bize gösterdiğiniz ilgi için teşekkür ederiz. En kısa sürede size dönüş yapacağız.'],
    ['Takip Mesajı', 'follow_up', 'Merhaba {customer_name}, gönderdiğimiz teklifi inceleme fırsatınız oldu mu? Sorularınız varsa yardımcı olmaktan memnuniyet duyarız.']
  ];

  for (const template of defaultTemplates) {
    await db.execute(
      'INSERT IGNORE INTO whatsapp_templates (name, template_type, content) VALUES (?, ?, ?)',
      template
    );
  }

  // Insert default system settings
  const defaultSettings = [
    ['app_name', 'Agency CRM Ultimate', 'string'],
    ['app_logo', '', 'string'],
    ['primary_color', '#3B82F6', 'string'],
    ['secondary_color', '#10B981', 'string'],
    ['language', 'tr', 'string'],
    ['theme_mode', 'auto', 'string'],
    ['font_family', 'Poppins', 'string'],
    ['openai_api_key', '', 'string'],
    ['twilio_account_sid', '', 'string'],
    ['twilio_auth_token', '', 'string'],
    ['twilio_whatsapp_number', '', 'string'],
    ['smtp_host', 'smtp.gmail.com', 'string'],
    ['smtp_port', '587', 'string'],
    ['smtp_user', '', 'string'],
    ['smtp_pass', '', 'string']
  ];

  for (const setting of defaultSettings) {
    await db.execute(
      'INSERT IGNORE INTO system_settings (setting_key, setting_value, setting_type) VALUES (?, ?, ?)',
      setting
    );
  }

  // Create default admin user if not exists
  const [adminExists] = await db.execute('SELECT id FROM users WHERE role = "admin" LIMIT 1');
  if (adminExists.length === 0) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await db.execute(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      ['admin', 'admin@agency.com', hashedPassword, 'admin']
    );
    console.log('✅ Default admin user created (admin@agency.com / admin123)');
  }
}

// Middleware for authentication
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// AUTH ROUTES
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: 'E-posta ve şifre gerekli.' });
    }
    
    const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ error: 'Geçersiz kullanıcı bilgileri' });
    }

    const user = users[0];
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Geçersiz kullanıcı bilgileri' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, username: user.username },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: 'Sunucu hatası oluştu.' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [result] = await db.execute(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );

    const token = jwt.sign(
      { id: result.insertId, email, role: 'user', username: username },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: result.insertId,
        username,
        email,
        role: 'user'
      }
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Bu e-posta adresi zaten kayıtlı.' });
    } else {
      console.error("Register error:", error);
      res.status(500).json({ error: 'Kayıt sırasında bir hata oluştu.' });
    }
  }
});


// SERVICES ROUTES
app.get('/api/services', authenticateToken, async (req, res) => {
  try {
    const [services] = await db.execute('SELECT * FROM services WHERE is_active = TRUE ORDER BY name');
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CUSTOMER ROUTES
app.get('/api/customers', authenticateToken, async (req, res) => {
  try {
    const { search, status } = req.query;
    let query = `
      SELECT c.*, 
             GROUP_CONCAT(s.name) as services
      FROM customers c
      LEFT JOIN customer_services cs ON c.id = cs.customer_id
      LEFT JOIN services s ON cs.service_id = s.id
    `;
    let params = [];

    if (search || status) {
      query += ' WHERE';
      const conditions = [];
      
      if (search) {
        conditions.push('(c.first_name LIKE ? OR c.last_name LIKE ? OR c.email LIKE ? OR c.company LIKE ?)');
        params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
      }
      
      if (status) {
        conditions.push('c.status = ?');
        params.push(status);
      }
      
      query += ' ' + conditions.join(' AND ');
    }
    
    query += ' GROUP BY c.id ORDER BY c.updated_at DESC';
    
    const [customers] = await db.execute(query, params);
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/customers', authenticateToken, async (req, res) => {
  try {
    const {
      first_name, last_name, email, phone, company,
      instagram, website, status, services
    } = req.body;

    const [result] = await db.execute(
      `INSERT INTO customers 
       (first_name, last_name, email, phone, company, instagram, website, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [first_name, last_name, email, phone, company, instagram, website, status || 'potential']
    );

    // Add selected services
    if (services && services.length > 0) {
      for (const serviceId of services) {
        await db.execute(
          'INSERT INTO customer_services (customer_id, service_id) VALUES (?, ?)',
          [result.insertId, serviceId]
        );
      }
    }

    const [customer] = await db.execute(`
      SELECT c.*, 
             GROUP_CONCAT(s.name) as services
      FROM customers c
      LEFT JOIN customer_services cs ON c.id = cs.customer_id
      LEFT JOIN services s ON cs.service_id = s.id
      WHERE c.id = ?
      GROUP BY c.id
    `, [result.insertId]);
    
    res.status(201).json(customer[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/customers/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { services, ...updates } = req.body;
    
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    
    await db.execute(
      `UPDATE customers SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [...values, id]
    );

    // Update services
    if (services !== undefined) {
      await db.execute('DELETE FROM customer_services WHERE customer_id = ?', [id]);
      if (services.length > 0) {
        for (const serviceId of services) {
          await db.execute(
            'INSERT INTO customer_services (customer_id, service_id) VALUES (?, ?)',
            [id, serviceId]
          );
        }
      }
    }

    const [customer] = await db.execute(`
      SELECT c.*, 
             GROUP_CONCAT(s.name) as services
      FROM customers c
      LEFT JOIN customer_services cs ON c.id = cs.customer_id
      LEFT JOIN services s ON cs.service_id = s.id
      WHERE c.id = ?
      GROUP BY c.id
    `, [id]);
    
    res.json(customer[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/customers/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute('DELETE FROM customers WHERE id = ?', [id]);
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AI CUSTOMER ANALYSIS - Enhanced with comprehensive analysis
app.post('/api/customers/:id/analyze', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!global.openai) {
      return res.status(400).json({ error: 'OpenAI entegrasyonu yapılandırılmamış' });
    }

    // Get customer info and all notes
    const [customer] = await db.execute(
      'SELECT * FROM customers WHERE id = ?', [id]
    );

    if (customer.length === 0) {
      return res.status(404).json({ error: 'Müşteri bulunamadı' });
    }

    const customerInfo = customer[0];

    // Get all customer notes
    const [notes] = await db.execute(
      'SELECT content, type, created_at FROM notes WHERE customer_id = ? ORDER BY created_at DESC',
      [id]
    );

    // Get customer meetings
    const [meetings] = await db.execute(
      'SELECT title, description, status, start_date FROM meetings WHERE customer_id = ? ORDER BY start_date DESC',
      [id]
    );

    // Get customer proposals
    const [proposals] = await db.execute(
      'SELECT title, description, total_amount, status FROM proposals WHERE customer_id = ? ORDER BY created_at DESC',
      [id]
    );

    if (notes.length === 0 && meetings.length === 0 && proposals.length === 0) {
      return res.status(400).json({ error: 'Analiz için yeterli veri bulunamadı. Lütfen önce müşteri ile ilgili notlar, toplantılar veya teklifler ekleyin.' });
    }

    // Prepare comprehensive data for analysis
    const analysisData = {
      customer: {
        name: `${customerInfo.first_name} ${customerInfo.last_name}`,
        company: customerInfo.company,
        email: customerInfo.email,
        phone: customerInfo.phone,
        instagram: customerInfo.instagram,
        website: customerInfo.website,
        current_status: customerInfo.status
      },
      notes: notes.map(note => ({
        content: note.content,
        type: note.type,
        date: note.created_at
      })),
      meetings: meetings.map(meeting => ({
        title: meeting.title,
        description: meeting.description,
        status: meeting.status,
        date: meeting.start_date
      })),
      proposals: proposals.map(proposal => ({
        title: proposal.title,
        description: proposal.description,
        amount: proposal.total_amount,
        status: proposal.status
      }))
    };

    const completion = await global.openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `Sen bir CRM AI analistisin. Müşteri verilerini analiz edip Türkçe olarak detaylı bir rapor hazırlıyorsun.

Analiz etmen gereken alanlar:
1. Müşteri Tipi (cold/warm/hot) - Etkileşim sıklığı ve kalitesine göre
2. İlgilendiği Hizmetler (Web Tasarım, Sosyal Medya Yönetimi, SEO, E-Ticaret, Grafik Tasarım, Logo Tasarım, Google Reklam, Meta Reklam, Marka Danışmanlığı)
3. Potansiyel Bütçe (Türk Lirası olarak)
4. Satış Zorluk Skoru (1-10, 1 kolay, 10 çok zor)
5. Detaylı Analiz Raporu
6. Öneriler ve Sonraki Adımlar

JSON formatında yanıt ver:
{
  "customer_type": "hot/warm/cold",
  "interested_services": "virgülle ayrılmış hizmet listesi",
  "potential_budget": sayısal değer,
  "sales_difficulty_score": 1-10 arası sayı,
  "detailed_analysis": "Detaylı analiz raporu",
  "recommendations": "Öneriler ve stratejiler",
  "next_actions": "Sonraki adımlar"
}`
        },
        {
          role: "user", 
          content: `Bu müşteri verilerini analiz et: ${JSON.stringify(analysisData, null, 2)}`
        }
      ],
      max_tokens: 1500,
      temperature: 0.7
    });

    const analysis = JSON.parse(completion.choices[0].message.content);
    
    // Update customer with AI analysis
    await db.execute(
      `UPDATE customers SET 
       customer_type = ?, 
       interested_services = ?, 
       potential_budget = ?, 
       sales_difficulty_score = ?,
       ai_analysis_date = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        analysis.customer_type || 'cold',
        analysis.interested_services || '',
        analysis.potential_budget || 0,
        analysis.sales_difficulty_score || 5,
        id
      ]
    );

    // Create AI-generated task if high priority customer
    if (analysis.customer_type === 'hot' && analysis.next_actions) {
      await db.execute(
        `INSERT INTO tasks 
         (customer_id, user_id, title, description, priority, due_date, created_by_ai, task_type)
         VALUES (?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 1 DAY), TRUE, 'ai_generated')`,
        [
          id,
          req.user.id,
          'AI Önerisi: Acil Takip',
          analysis.next_actions,
          'high'
        ]
      );
    }

    res.json(analysis);
  } catch (error) {
    console.error('AI Analysis error:', error);
    res.status(500).json({ error: 'AI analizi sırasında hata oluştu: ' + error.message });
  }
});

// PROPOSALS ROUTES
app.get('/api/proposals', authenticateToken, async (req, res) => {
  try {
    const [proposals] = await db.execute(`
      SELECT p.*, 
             CONCAT(c.first_name, ' ', c.last_name) as customer_name,
             c.company,
             u.username as user_name
      FROM proposals p
      LEFT JOIN customers c ON p.customer_id = c.id
      LEFT JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
    `);
    
    res.json(proposals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/customers/:customerId/proposals', authenticateToken, async (req, res) => {
  try {
    const { customerId } = req.params;
    
    const [proposals] = await db.execute(`
      SELECT p.*, 
             u.username as user_name,
             (SELECT JSON_ARRAYAGG(
               JSON_OBJECT(
                 'id', pi.id,
                 'service_name', s.name,
                 'description', pi.description,
                 'quantity', pi.quantity,
                 'unit_price', pi.unit_price,
                 'total_price', pi.total_price
               )
             ) FROM proposal_items pi 
             LEFT JOIN services s ON pi.service_id = s.id 
             WHERE pi.proposal_id = p.id) as items
      FROM proposals p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.customer_id = ?
      ORDER BY p.created_at DESC
    `, [customerId]);
    
    res.json(proposals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/proposals', authenticateToken, async (req, res) => {
  try {
    const { customer_id, title, description, items, valid_until } = req.body;
    const user_id = req.user.id;

    const total_amount = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

    const [result] = await db.execute(
      `INSERT INTO proposals (customer_id, user_id, title, description, total_amount, valid_until)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [customer_id, user_id, title, description, total_amount, valid_until]
    );

    // Add proposal items
    for (const item of items) {
      await db.execute(
        `INSERT INTO proposal_items (proposal_id, service_id, description, quantity, unit_price, total_price)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [result.insertId, item.service_id, item.description, item.quantity, item.unit_price, item.quantity * item.unit_price]
      );
    }

    const [proposal] = await db.execute(`
      SELECT p.*, 
             CONCAT(c.first_name, ' ', c.last_name) as customer_name,
             c.company,
             u.username as user_name
      FROM proposals p
      LEFT JOIN customers c ON p.customer_id = c.id
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `, [result.insertId]);

    res.status(201).json(proposal[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/proposals/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    await db.execute('UPDATE proposals SET status = ? WHERE id = ?', [status, id]);
    
    const [proposal] = await db.execute(`
      SELECT p.*, 
             CONCAT(c.first_name, ' ', c.last_name) as customer_name,
             c.company,
             u.username as user_name
      FROM proposals p
      LEFT JOIN customers c ON p.customer_id = c.id
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `, [id]);
    
    res.json(proposal[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// EXPENSES ROUTES
app.get('/api/expenses', authenticateToken, async (req, res) => {
  try {
    const [expenses] = await db.execute(`
      SELECT e.*, 
             CONCAT(c.first_name, ' ', c.last_name) as customer_name,
             p.title as proposal_title
      FROM expenses e
      LEFT JOIN customers c ON e.customer_id = c.id
      LEFT JOIN proposals p ON e.proposal_id = p.id
      ORDER BY e.expense_date DESC
    `);
    
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/expenses', authenticateToken, async (req, res) => {
  try {
    const { customer_id, proposal_id, title, description, amount, category, expense_date } = req.body;

    const [result] = await db.execute(
      `INSERT INTO expenses (customer_id, proposal_id, title, description, amount, category, expense_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [customer_id, proposal_id, title, description, amount, category, expense_date]
    );

    const [expense] = await db.execute(`
      SELECT e.*, 
             CONCAT(c.first_name, ' ', c.last_name) as customer_name,
             p.title as proposal_title
      FROM expenses e
      LEFT JOIN customers c ON e.customer_id = c.id
      LEFT JOIN proposals p ON e.proposal_id = p.id
      WHERE e.id = ?
    `, [result.insertId]);

    res.status(201).json(expense[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// NOTES ROUTES
app.get('/api/customers/:customerId/notes', authenticateToken, async (req, res) => {
  try {
    const { customerId } = req.params;
    
    const [notes] = await db.execute(`
      SELECT n.*, u.username as author_name,
             a.sentiment, a.priority, a.suggestions, a.next_actions, a.confidence_score
      FROM notes n
      LEFT JOIN users u ON n.user_id = u.id
      LEFT JOIN ai_analysis a ON n.id = a.note_id
      WHERE n.customer_id = ?
      ORDER BY n.created_at DESC
    `, [customerId]);
    
    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/customers/:customerId/notes', authenticateToken, async (req, res) => {
  try {
    const { customerId } = req.params;
    const { content, type } = req.body;
    const userId = req.user.id;

    const [result] = await db.execute(
      'INSERT INTO notes (customer_id, user_id, content, type) VALUES (?, ?, ?, ?)',
      [customerId, userId, content, type || 'general']
    );

    // Update customer last interaction
    await db.execute(
      'UPDATE customers SET last_interaction = CURRENT_TIMESTAMP WHERE id = ?',
      [customerId]
    );

    // AI Analysis if OpenAI is configured
    if (global.openai && content.length > 50) {
      try {
        const completion = await global.openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `Sen bir CRM asistanısın. Müşteri notunu analiz et ve Türkçe olarak şunları sağla:
              1) Duygu durumu (pozitif/nötr/negatif)
              2) Öncelik (düşük/orta/yüksek)
              3) Kısa öneriler
              4) Sonraki adımlar
              
              JSON formatında yanıt ver:
              {
                "sentiment": "pozitif/nötr/negatif",
                "priority": "düşük/orta/yüksek", 
                "suggestions": "kısa öneriler",
                "next_actions": "sonraki adımlar"
              }`
            },
            {
              role: "user", 
              content: `Bu müşteri notunu analiz et: "${content}"`
            }
          ],
          max_tokens: 500
        });

        const analysis = JSON.parse(completion.choices[0].message.content);
        
        await db.execute(
          `INSERT INTO ai_analysis 
           (note_id, sentiment, priority, suggestions, next_actions, confidence_score)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            result.insertId,
            analysis.sentiment || 'nötr',
            analysis.priority || 'orta',
            analysis.suggestions || '',
            analysis.next_actions || '',
            0.85
          ]
        );

        // Create AI-generated task if high priority
        if (analysis.priority === 'yüksek' && analysis.next_actions) {
          await db.execute(
            `INSERT INTO tasks 
             (customer_id, user_id, title, description, priority, due_date, created_by_ai, task_type)
             VALUES (?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 2 DAY), TRUE, 'ai_generated')`,
            [
              customerId,
              userId,
              'AI Önerisi: Acil Takip',
              analysis.next_actions,
              'high'
            ]
          );
        }
      } catch (aiError) {
        console.log('AI Analysis failed:', aiError.message);
      }
    }

    const [note] = await db.execute(`
      SELECT n.*, u.username as author_name
      FROM notes n
      LEFT JOIN users u ON n.user_id = u.id
      WHERE n.id = ?
    `, [result.insertId]);

    res.status(201).json(note[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// MEETINGS ROUTES
app.get('/api/meetings', authenticateToken, async (req, res) => {
  try {
    const [meetings] = await db.execute(`
      SELECT m.*, 
             CONCAT(c.first_name, ' ', c.last_name) as customer_name,
             c.company,
             u.username as user_name
      FROM meetings m
      LEFT JOIN customers c ON m.customer_id = c.id
      LEFT JOIN users u ON m.user_id = u.id
      ORDER BY m.start_date ASC
    `);
    
    res.json(meetings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/meetings', authenticateToken, async (req, res) => {
  try {
    const { customer_id, title, description, start_date, end_date } = req.body;
    const user_id = req.user.id;

    const [result] = await db.execute(
      `INSERT INTO meetings (customer_id, user_id, title, description, start_date, end_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [customer_id, user_id, title, description, start_date, end_date]
    );

    const [meeting] = await db.execute(`
      SELECT m.*, 
             CONCAT(c.first_name, ' ', c.last_name) as customer_name,
             c.company,
             u.username as user_name
      FROM meetings m
      LEFT JOIN customers c ON m.customer_id = c.id
      LEFT JOIN users u ON m.user_id = u.id
      WHERE m.id = ?
    `, [result.insertId]);

    res.status(201).json(meeting[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/meetings/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    await db.execute('UPDATE meetings SET status = ? WHERE id = ?', [status, id]);
    
    const [meeting] = await db.execute(`
      SELECT m.*, 
             CONCAT(c.first_name, ' ', c.last_name) as customer_name,
             c.company,
             u.username as user_name
      FROM meetings m
      LEFT JOIN customers c ON m.customer_id = c.id
      LEFT JOIN users u ON m.user_id = u.id
      WHERE m.id = ?
    `, [id]);
    
    res.json(meeting[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// TASKS ROUTES
app.get('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const [tasks] = await db.execute(`
      SELECT t.*, 
             CONCAT(c.first_name, ' ', c.last_name) as customer_name,
             c.company
      FROM tasks t
      LEFT JOIN customers c ON t.customer_id = c.id
      WHERE t.user_id = ?
      ORDER BY 
        CASE t.priority 
          WHEN 'high' THEN 1 
          WHEN 'medium' THEN 2 
          WHEN 'low' THEN 3 
        END,
        t.due_date ASC
    `, [req.user.id]);
    
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const { customer_id, title, description, priority, due_date, task_type } = req.body;
    const user_id = req.user.id;

    const [result] = await db.execute(
      `INSERT INTO tasks (customer_id, user_id, title, description, priority, due_date, task_type)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [customer_id, user_id, title, description, priority || 'medium', due_date, task_type || 'manual']
    );

    const [task] = await db.execute(`
      SELECT t.*, 
             CONCAT(c.first_name, ' ', c.last_name) as customer_name,
             c.company
      FROM tasks t
      LEFT JOIN customers c ON t.customer_id = c.id
      WHERE t.id = ?
    `, [result.insertId]);

    res.status(201).json(task[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    await db.execute('UPDATE tasks SET status = ? WHERE id = ?', [status, id]);
    
    const [task] = await db.execute(`
      SELECT t.*, 
             CONCAT(c.first_name, ' ', c.last_name) as customer_name,
             c.company
      FROM tasks t
      LEFT JOIN customers c ON t.customer_id = c.id
      WHERE t.id = ?
    `, [id]);
    
    res.json(task[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DASHBOARD ROUTES
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    // Active customers count
    const [activeCustomers] = await db.execute(
      'SELECT COUNT(*) as count FROM customers WHERE status = "active"'
    );
    
    // Weekly meetings count
    const [weeklyMeetings] = await db.execute(`
      SELECT COUNT(*) as count FROM meetings 
      WHERE start_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      AND start_date <= DATE_ADD(NOW(), INTERVAL 7 DAY)
    `);
    
    // Recent notes count
    const [recentNotes] = await db.execute(`
      SELECT COUNT(*) as count FROM notes 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `);
    
    // Pending tasks
    const [pendingTasks] = await db.execute(
      'SELECT COUNT(*) as count FROM tasks WHERE status = "pending" AND user_id = ?',
      [req.user.id]
    );

    // Total proposal amount
    const [totalProposals] = await db.execute(
      'SELECT COALESCE(SUM(total_amount), 0) as total FROM proposals'
    );

    // Won proposals (approved)
    const [wonProposals] = await db.execute(
      'SELECT COALESCE(SUM(total_amount), 0) as total FROM proposals WHERE status = "approved"'
    );

    // Lost proposals (rejected)
    const [lostProposals] = await db.execute(
      'SELECT COALESCE(SUM(total_amount), 0) as total FROM proposals WHERE status = "rejected"'
    );

    // Monthly customer growth
    const [monthlyCustomers] = await db.execute(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as count
      FROM customers 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month
    `);
    
    // Top interacted customers
    const [topCustomers] = await db.execute(`
      SELECT c.id, CONCAT(c.first_name, ' ', c.last_name) as name, 
             c.company, COUNT(n.id) as note_count
      FROM customers c
      LEFT JOIN notes n ON c.id = n.customer_id
      WHERE n.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY c.id
      ORDER BY note_count DESC
      LIMIT 5
    `);

    res.json({
      activeCustomers: activeCustomers[0].count,
      weeklyMeetings: weeklyMeetings[0].count,
      recentNotes: recentNotes[0].count,
      pendingTasks: pendingTasks[0].count,
      totalProposals: totalProposals[0].total,
      wonProposals: wonProposals[0].total,
      lostProposals: lostProposals[0].total,
      monthlyCustomers,
      topCustomers
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// WHATSAPP ROUTES
app.get('/api/whatsapp/templates', authenticateToken, async (req, res) => {
  try {
    const [templates] = await db.execute('SELECT * FROM whatsapp_templates WHERE is_active = TRUE');
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/whatsapp/send', authenticateToken, async (req, res) => {
  try {
    if (!global.twilioClient) {
      return res.status(400).json({ error: 'WhatsApp entegrasyonu yapılandırılmamış' });
    }

    const { customer_id, message } = req.body;
    
    const [customers] = await db.execute('SELECT phone FROM customers WHERE id = ?', [customer_id]);
    if (customers.length === 0) {
      return res.status(404).json({ error: 'Müşteri bulunamadı' });
    }

    const customer = customers[0];
    const whatsappNumber = `whatsapp:+${customer.phone.replace(/[^\d]/g, '')}`;
    
    const twilioMessage = await global.twilioClient.messages.create({
      body: message,
      from: globalSettings.twilio_whatsapp_number || process.env.TWILIO_WHATSAPP_NUMBER,
      to: whatsappNumber
    });

    // Save to database
    await db.execute(
      'INSERT INTO whatsapp_messages (customer_id, direction, message, status, phone_number) VALUES (?, ?, ?, ?, ?)',
      [customer_id, 'outbound', message, twilioMessage.status, customer.phone]
    );

    res.json({ success: true, messageId: twilioMessage.sid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AI SALES ASSISTANT
app.post('/api/ai/generate-message', authenticateToken, async (req, res) => {
  try {
    if (!global.openai) {
      return res.status(400).json({ error: 'OpenAI entegrasyonu yapılandırılmamış' });
    }

    const { customer_id, message_type } = req.body;
    
    // Get customer data
    const [customers] = await db.execute(`
      SELECT c.*, 
             GROUP_CONCAT(s.name) as services,
             (SELECT content FROM notes WHERE customer_id = c.id ORDER BY created_at DESC LIMIT 3) as recent_notes
      FROM customers c
      LEFT JOIN customer_services cs ON c.id = cs.customer_id
      LEFT JOIN services s ON cs.service_id = s.id
      WHERE c.id = ?
      GROUP BY c.id
    `, [customer_id]);

    if (customers.length === 0) {
      return res.status(404).json({ error: 'Müşteri bulunamadı' });
    }

    const customer = customers[0];
    
    const prompts = {
      'first_contact': `${customer.first_name} ${customer.last_name} (${customer.company || 'şirket'}) için profesyonel bir ilk temas mesajı oluştur. Samimi ve profesyonel olsun.`,
      'proposal_response': `${customer.first_name} için gönderilen teklif hakkında takip mesajı oluştur. Kibar ve teşvik edici olsun.`,
      'thank_you': `${customer.first_name} için toplantı veya etkileşim sonrası teşekkür mesajı oluştur.`,
      'follow_up': `${customer.first_name} için karar veya ihtiyaçlarını kontrol etmek üzere takip mesajı oluştur.`
    };

    const completion = await global.openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Sen dijital ajans için profesyonel bir satış asistanısın. Kişiselleştirilmiş, samimi ve profesyonel Türkçe mesajlar oluştur."
        },
        {
          role: "user", 
          content: prompts[message_type] || prompts['first_contact']
        }
      ],
      max_tokens: 200
    });

    res.json({ message: completion.choices[0].message.content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// TRANSCRIPTION ROUTE
app.post('/api/transcribe', authenticateToken, upload.single('audio'), async (req, res) => {
  try {
    if (!global.openai) {
      return res.status(400).json({ error: 'OpenAI entegrasyonu yapılandırılmamış' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Ses dosyası sağlanmadı' });
    }

    const transcription = await global.openai.audio.transcriptions.create({
      file: fs.createReadStream(req.file.path),
      model: 'whisper-1',
      language: 'tr'
    });

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({ text: transcription.text });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AUDIO UPLOAD AND TRANSCRIBE
app.post('/api/customers/:customerId/upload-audio', authenticateToken, upload.single('audio'), async (req, res) => {
  try {
    const { customerId } = req.params;
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ error: 'Ses dosyası sağlanmadı.' });
    }

    if (!global.openai) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'OpenAI entegrasyonu yapılandırılmamış. Lütfen Yönetim Panelini kontrol edin.' });
    }

    let transcribedText = '';
    
    try {
      console.log(`Transkripsiyon başlatılıyor: ${req.file.path}`);
      const transcription = await global.openai.audio.transcriptions.create({
        file: fs.createReadStream(req.file.path),
        model: 'whisper-1',
        language: 'tr'
      });
      transcribedText = transcription.text;
      console.log('Transkripsiyon başarılı.');
    } catch (transcriptionError) {
      console.error('OpenAI Transkripsiyon Hatası:', transcriptionError);
      fs.unlinkSync(req.file.path);
      return res.status(500).json({ error: `OpenAI Transkript Hatası: ${transcriptionError.message}` });
    }
    
    // Başarılı transkripsiyondan sonra dosyayı sil
    fs.unlinkSync(req.file.path);

    // Notu veritabanına kaydet
    const [result] = await db.execute(
      'INSERT INTO notes (customer_id, user_id, content, type, is_transcribed) VALUES (?, ?, ?, ?, ?)',
      [customerId, userId, transcribedText, 'audio', true]
    );
    const newNoteId = result.insertId;

    // Müşterinin son etkileşim zamanını güncelle
    await db.execute(
      'UPDATE customers SET last_interaction = CURRENT_TIMESTAMP WHERE id = ?',
      [customerId]
    );

    // Yeni oluşturulan notun temel bilgilerini geri döndür
    const [note] = await db.execute(`
      SELECT n.*, u.username as author_name
      FROM notes n
      LEFT JOIN users u ON n.user_id = u.id
      WHERE n.id = ?
    `, [newNoteId]);

    res.status(201).json(note[0]);
  } catch (error) {
    // Genel hataları yakala ve yüklenen dosyayı sil
    if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
    }
    console.error("Genel ses yükleme hatası:", error);
    res.status(500).json({ error: error.message });
  }
});}
    }

    // Save note with audio file
    const [result] = await db.execute(
      'INSERT INTO notes (customer_id, user_id, content, type, is_transcribed, audio_file_path) VALUES (?, ?, ?, ?, ?, ?)',
      [customerId, userId, transcribedText || 'Ses dosyası yüklendi', 'audio', !!transcribedText, req.file.path]
    );

    // Update customer last interaction
    await db.execute(
      'UPDATE customers SET last_interaction = CURRENT_TIMESTAMP WHERE id = ?',
      [customerId]
    );

    const [note] = await db.execute(`
      SELECT n.*, u.username as author_name
      FROM notes n
      LEFT JOIN users u ON n.user_id = u.id
      WHERE n.id = ?
    `, [result.insertId]);

    res.status(201).json(note[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});




// DATA EXPORT/IMPORT
app.get('/api/export/:type', authenticateToken, async (req, res) => {
  try {
    const { type } = req.params;
    let data = [];

    switch (type) {
      case 'customers':
        const [customers] = await db.execute(`
          SELECT c.*, GROUP_CONCAT(s.name) as services
          FROM customers c
          LEFT JOIN customer_services cs ON c.id = cs.customer_id
          LEFT JOIN services s ON cs.service_id = s.id
          GROUP BY c.id
        `);
        data = customers;
        break;
      case 'proposals':
        const [proposals] = await db.execute(`
          SELECT p.*, CONCAT(c.first_name, ' ', c.last_name) as customer_name
          FROM proposals p
          LEFT JOIN customers c ON p.customer_id = c.id
        `);
        data = proposals;
        break;
      case 'tasks':
        const [tasks] = await db.execute(`
          SELECT t.*, CONCAT(c.first_name, ' ', c.last_name) as customer_name
          FROM tasks t
          LEFT JOIN customers c ON t.customer_id = c.id
        `);
        data = tasks;
        break;
      default:
        return res.status(400).json({ error: 'Geçersiz dışa aktarma türü' });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// SYSTEM SETTINGS
app.get('/api/settings', authenticateToken, async (req, res) => {
  try {
    const [settings] = await db.execute('SELECT * FROM system_settings');
    const settingsObj = {};
    settings.forEach(setting => {
      settingsObj[setting.setting_key] = setting.setting_value;
    });
    res.json(settingsObj);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/settings', authenticateToken, async (req, res) => {
  try {
    const settings = req.body;
    
    for (const [key, value] of Object.entries(settings)) {
      await db.execute(
        'INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        [key, value, value]
      );
    }
    
    // Reload settings and reinitialize services
    await loadSettings();
    
    res.json({ message: 'Ayarlar başarıyla güncellendi' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API TEST ROUTES
app.post('/api/test/openai', authenticateToken, async (req, res) => {
  try {
    // Reload settings first
    await loadSettings();
    
    if (!global.openai) {
      return res.status(400).json({ error: 'OpenAI API anahtarı yapılandırılmamış' });
    }

    const completion = await global.openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: "Merhaba, test mesajı" }],
      max_tokens: 10
    });

    res.json({ 
      success: true, 
      message: 'OpenAI API çalışıyor',
      response: completion.choices[0].message.content
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/test/smtp', authenticateToken, async (req, res) => {
  try {
    if (!global.emailTransporter) {
      return res.status(400).json({ error: 'SMTP yapılandırılmamış' });
    }

    await global.emailTransporter.verify();
    res.json({ success: true, message: 'SMTP bağlantısı çalışıyor' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server Error:', error);
  res.status(500).json({ error: 'Sunucu hatası' });
});

// Start server
// ...
// ... diğer tüm kodlarınız
// ...

initializeDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Agency CRM Server running on port ${PORT}`);
    console.log(`✅ CORS İzni Verilen Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
    console.log(`🗄️  Database: ${dbConfig.host}:3306/${dbConfig.database}`);
  });
    });
});