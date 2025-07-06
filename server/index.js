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
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
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
    console.log('✅ Database connected and tables created');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    console.log('📋 Please ensure MySQL is running and create the database:');
    console.log(`   CREATE DATABASE ${dbConfig.database};`);
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
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS notes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      customer_id INT NOT NULL,
      user_id INT NOT NULL,
      type ENUM('phone', 'meeting', 'email', 'whatsapp', 'general') DEFAULT 'general',
      content TEXT NOT NULL,
      is_transcribed BOOLEAN DEFAULT FALSE,
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
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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

// Initialize external services
let openai, twilioClient, emailTransporter;

if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

if (process.env.SMTP_HOST) {
  emailTransporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

// AUTH ROUTES
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
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
    res.status(500).json({ error: error.message });
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
      { id: result.insertId, email, role: 'user' },
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
      res.status(400).json({ error: 'User already exists' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// CUSTOMER ROUTES
app.get('/api/customers', authenticateToken, async (req, res) => {
  try {
    const { search, status } = req.query;
    let query = 'SELECT * FROM customers';
    let params = [];

    if (search || status) {
      query += ' WHERE';
      const conditions = [];
      
      if (search) {
        conditions.push('(first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR company LIKE ?)');
        params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
      }
      
      if (status) {
        conditions.push('status = ?');
        params.push(status);
      }
      
      query += ' ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY updated_at DESC';
    
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
      instagram, website, status
    } = req.body;

    const [result] = await db.execute(
      `INSERT INTO customers 
       (first_name, last_name, email, phone, company, instagram, website, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [first_name, last_name, email, phone, company, instagram, website, status || 'potential']
    );

    const [customer] = await db.execute('SELECT * FROM customers WHERE id = ?', [result.insertId]);
    res.status(201).json(customer[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/customers/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    
    await db.execute(
      `UPDATE customers SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [...values, id]
    );

    const [customer] = await db.execute('SELECT * FROM customers WHERE id = ?', [id]);
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
    if (openai && content.length > 50) {
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are a CRM assistant. Analyze the customer note and provide: 1) sentiment (positive/neutral/negative), 2) priority (low/medium/high), 3) brief suggestions, 4) next actions. Respond in JSON format."
            },
            {
              role: "user", 
              content: `Analyze this customer note: "${content}"`
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
            analysis.sentiment || 'neutral',
            analysis.priority || 'medium',
            analysis.suggestions || '',
            analysis.next_actions || '',
            0.85
          ]
        );

        // Create AI-generated task if high priority
        if (analysis.priority === 'high' && analysis.next_actions) {
          await db.execute(
            `INSERT INTO tasks 
             (customer_id, user_id, title, description, priority, due_date, created_by_ai)
             VALUES (?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 2 DAY), TRUE)`,
            [
              customerId,
              userId,
              'AI Suggested Follow-up',
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

    // Pending tasks
    const [pendingTasks] = await db.execute(
      'SELECT COUNT(*) as count FROM tasks WHERE status = "pending" AND user_id = ?',
      [req.user.id]
    );

    res.json({
      activeCustomers: activeCustomers[0].count,
      weeklyMeetings: weeklyMeetings[0].count,
      recentNotes: recentNotes[0].count,
      pendingTasks: pendingTasks[0].count,
      topCustomers
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// WHATSAPP ROUTES
app.post('/api/whatsapp/send', authenticateToken, async (req, res) => {
  try {
    if (!twilioClient) {
      return res.status(400).json({ error: 'WhatsApp integration not configured' });
    }

    const { customer_id, message } = req.body;
    
    const [customers] = await db.execute('SELECT phone FROM customers WHERE id = ?', [customer_id]);
    if (customers.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const customer = customers[0];
    const whatsappNumber = `whatsapp:+${customer.phone.replace(/[^\d]/g, '')}`;
    
    const twilioMessage = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: whatsappNumber
    });

    // Save to database
    await db.execute(
      'INSERT INTO whatsapp_messages (customer_id, direction, message, status) VALUES (?, ?, ?, ?)',
      [customer_id, 'outbound', message, twilioMessage.status]
    );

    res.json({ success: true, messageId: twilioMessage.sid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- YENİ WHATSAPP ENDPOINT'LERİ ---

// 1. Müşterinin WhatsApp mesaj geçmişini getiren endpoint
app.get('/api/customers/:customerId/whatsapp-messages', authenticateToken, async (req, res) => {
  try {
    const { customerId } = req.params;
    const [messages] = await db.execute(
      'SELECT * FROM whatsapp_messages WHERE customer_id = ? ORDER BY created_at ASC',
      [customerId]
    );
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Mesaj geçmişi alınırken bir hata oluştu: ' + error.message });
  }
});

// 2. Twilio'dan gelen mesajları yakalamak için Webhook endpoint'i
// Not: Bu endpoint'in authenticateToken'ı olmamalıdır, çünkü Twilio'dan gelen isteklerde token bulunmaz.
app.post('/api/whatsapp/webhook', express.urlencoded({ extended: false }), async (req, res) => {
  const { From, Body } = req.body; // Twilio'dan gelen mesaj bilgileri

  console.log(`Gelen Mesaj - Kimden: ${From}, İçerik: ${Body}`);

  try {
    // Telefon numarasından '+' ve 'whatsapp:' ön ekini temizle
    const fromNumber = From.replace('whatsapp:+', '');

    // Bu telefon numarasına sahip müşteriyi bul
    const [customers] = await db.execute(
      'SELECT id FROM customers WHERE phone LIKE ?', 
      [`%${fromNumber}%`]
    );

    if (customers.length > 0) {
      const customerId = customers[0].id;
      
      // Gelen mesajı veritabanına kaydet
      await db.execute(
        'INSERT INTO whatsapp_messages (customer_id, direction, message, status, phone_number) VALUES (?, ?, ?, ?, ?)',
        [customerId, 'inbound', Body, 'received', fromNumber]
      );
      
      console.log(`Mesaj, müşteri ID ${customerId} için veritabanına kaydedildi.`);
    } else {
      console.warn(`Bu numaraya sahip bir müşteri bulunamadı: ${fromNumber}`);
      // İsteğe bağlı: Bilinmeyen numaralardan gelen mesajları kaydetmek için bir "unknown_messages" tablosu oluşturulabilir.
    }

    // Twilio'ya boş bir yanıt göndererek mesajın alındığını onayla
    res.status(200).send('<Response/>');

  } catch (error) {
    console.error('Webhook hatası:', error);
    res.status(500).send('<Response/>');
  }
});

// --- YENİ ENDPOINT'LERİN SONU ---
// --- BU KOD BLOĞUNU KOPYALAYIN ---

// --- SETTINGS ROTALARI ---
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
    await loadSettings(); // Buradaki çağrı artık çalışacak
    res.json({ message: 'Ayarlar başarıyla güncellendi' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- KOPYALAMA İŞLEMİNİN SONU ---

// --- BURADAN BAŞLAYARAK EKSİK KODU EKLEYİN ---
app.post('/api/test/twilio', authenticateToken, async (req, res) => {
  try {
    // Ayarları yeniden yükleyerek en güncel anahtarları al
    await loadSettings();
    
    if (!global.twilioClient) {
      return res.status(400).json({ error: 'Twilio bilgileri yapılandırılmamış. Lütfen Admin Panelini kontrol edin.' });
    }

    // Twilio'ya basit bir istek göndererek kimlik bilgilerini doğrula
    // Örneğin, hesap detaylarını çekmeyi deneyebiliriz.
    const accountSid = globalSettings.twilio_account_sid;
    if (!accountSid) {
      return res.status(400).json({ error: 'Account SID ayarlanmamış.' });
    }
    await global.twilioClient.api.v2010.accounts(accountSid).fetch();

    res.json({ 
      success: true, 
      message: 'Twilio entegrasyonu başarılı! Kimlik bilgileri doğrulandı.'
    });
  } catch (error) {
    console.error('TWILIO TEST HATASI:', error);
    res.status(400).json({ error: `Twilio bağlantı hatası: ${error.message}` });
  }
});
// --- EKLEME İŞLEMİNİN SONU ---

// TRANSCRIPTION ROUTE
app.post('/api/transcribe', authenticateToken, upload.single('audio'), async (req, res) => {
  try {
    if (!openai) {
      return res.status(400).json({ error: 'OpenAI not configured' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(req.file.path),
      model: 'whisper-1',
    });

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({ text: transcription.text });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server Error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
initializeDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Agency CRM Server running on port ${PORT}`);
    console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
    console.log(`🗄️  Database: ${dbConfig.host}:3306/${dbConfig.database}`);
  });
});