const express = require('express');
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');
const db = require('./db');

const app = express();

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(
  session({
    secret: 'jala-magnus-clone-secret',
    resave: false,
    saveUninitialized: false,
  })
);

// Middleware to set current path for active navigation
app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  next();
});

// Simple in-memory user (demo credentials from JALA Academy info)
const DEMO_USER = {
  email: 'training@jalaacademy.com',
  password: 'jobprogram', // In real apps, never store plain text
};

function requireAuth(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  res.redirect('/login');
}

app.get('/', (req, res) => {
  res.redirect('/home');
});

app.get('/login', (req, res) => {
  if (req.session && req.session.user) {
    return res.redirect('/home');
  }
  res.render('login', { error: null });
});

app.post('/login', (req, res) => {
  const { email, password, rememberMe } = req.body;

  if (email === DEMO_USER.email && password === DEMO_USER.password) {
    req.session.user = { email };

    if (rememberMe) {
      // Simple remember-me via longer cookie age
      req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000;
    }

    return res.redirect('/home');
  }

  res.status(401).render('login', { error: 'Invalid email or password' });
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/home');
  });
});

// Core pages (placeholders reflecting structure)
app.get('/home', (req, res) => {
  res.render('home', { user: req.session?.user || null });
});

app.get('/home/menu', (req, res) => {
  res.render('menu', { user: req.session?.user || null });
});

app.get('/subscription', (req, res) => {
  res.render('subscription', { user: req.session?.user || null });
});

// Employees CRUD (business-logic-focused demo)
app.get('/employees', (req, res) => {
  db.all('SELECT * FROM employees ORDER BY id DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).send('Error loading employees');
    }
    res.render('employees-list', { user: req.session?.user || null, employees: rows });
  });
});

app.get('/employees/new', (req, res) => {
  res.render('employees-form', { user: req.session?.user || null, employee: null, error: null });
});

app.post('/employees', (req, res) => {
  const { name, email, department, salary, status } = req.body;
  db.run(
    'INSERT INTO employees (name, email, department, salary, status) VALUES (?, ?, ?, ?, ?)',
    [name, email, department, salary || null, status || 'Active'],
    function (err) {
      if (err) {
        return res.status(400).render('employees-form', {
          user: req.session?.user || null,
          employee: req.body,
          error: 'Could not create employee (maybe duplicate email).',
        });
      }
      res.redirect('/employees');
    }
  );
});

app.get('/employees/:id/edit', (req, res) => {
  db.get('SELECT * FROM employees WHERE id = ?', [req.params.id], (err, row) => {
    if (err || !row) {
      return res.status(404).send('Employee not found');
    }
    res.render('employees-form', { user: req.session?.user || null, employee: row, error: null });
  });
});

// Employee Create page (detailed profile like Magnus)
app.get('/employee/create', (req, res) => {
  const countries = ['India', 'USA', 'UK'];
  const cities = ['Hyderabad', 'Bangalore', 'Chennai', 'Pune'];
  const skills = ['AWS', 'QA-Automation', 'DevOps', 'WebServices', 'Full Stack Developer', 'Middleware'];

  res.render('employee-create', {
    user: req.session?.user || null,
    form: {},
    errors: [],
    countries,
    cities,
    skills,
  });
});

app.post('/employee/create', (req, res) => {
  const {
    first_name,
    last_name,
    email,
    mobile,
    dob,
    gender,
    address,
    country,
    city,
    other_city,
    skills,
  } = req.body;

  const countries = ['India', 'USA', 'UK'];
  const cities = ['Hyderabad', 'Bangalore', 'Chennai', 'Pune'];
  const allSkills = ['AWS', 'QA-Automation', 'DevOps', 'WebServices', 'Full Stack Developer', 'Middleware'];

  const errors = [];
  if (!first_name || !first_name.trim()) errors.push('First Name is required');
  if (!email || !email.trim()) errors.push('Email is required');

  const skillsValue = Array.isArray(skills) ? skills.join(',') : skills || '';

  if (errors.length) {
    return res.status(400).render('employee-create', {
      user: req.session?.user || null,
      form: req.body,
      errors,
      countries,
      cities,
      skills: allSkills,
    });
  }

  db.run(
    `INSERT INTO employee_profiles 
      (first_name, last_name, email, mobile, dob, gender, address, country, city, other_city, skills)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      first_name.trim(),
      last_name ? last_name.trim() : null,
      email.trim(),
      mobile || null,
      dob || null,
      gender || null,
      address || null,
      country || null,
      city || null,
      other_city || null,
      skillsValue,
    ],
    function (err) {
      if (err) {
        return res.status(500).render('employee-create', {
          user: req.session?.user || null,
          form: req.body,
          errors: ['Could not save employee profile.'],
          countries,
          cities,
          skills: allSkills,
        });
      }

      res.render('employee-create', {
        user: req.session?.user || null,
        form: {},
        errors: [],
        countries,
        cities,
        skills: allSkills,
        success: 'Employee saved successfully.',
      });
    }
  );
});

// Employee Search, Edit, Delete based on employee_profiles
app.get('/employee/search', (req, res) => {
  const { name, mobile } = req.query;
  const countries = ['India', 'USA', 'UK'];

  let query = 'SELECT * FROM employee_profiles WHERE 1=1';
  const params = [];

  if (name && name.trim()) {
    query += ' AND first_name LIKE ?';
    params.push(`%${name.trim()}%`);
  }
  if (mobile && mobile.trim()) {
    query += ' AND mobile LIKE ?';
    params.push(`%${mobile.trim()}%`);
  }

  query += ' ORDER BY id DESC';

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).send('Error searching employees');
    }
    res.render('employee-search', {
      user: req.session?.user || null,
      filters: { name: name || '', mobile: mobile || '' },
      employees: rows,
      countries,
    });
  });
});

app.post('/employee/search', (req, res) => {
  const { name, mobile } = req.body;
  const qs = new URLSearchParams({ name: name || '', mobile: mobile || '' }).toString();
  res.redirect(`/employee/search?${qs}`);
});

app.get('/employee/:id/edit', (req, res) => {
  const id = req.params.id;
  const countries = ['India', 'USA', 'UK'];
  const cities = ['Hyderabad', 'Bangalore', 'Chennai', 'Pune'];
  const skills = ['AWS', 'QA-Automation', 'DevOps', 'WebServices', 'Full Stack Developer', 'Middleware'];

  db.get('SELECT * FROM employee_profiles WHERE id = ?', [id], (err, row) => {
    if (err || !row) {
      return res.status(404).send('Employee not found');
    }

    res.render('employee-edit', {
      user: req.session?.user || null,
      employee: row,
      errors: [],
      countries,
      cities,
      skills,
    });
  });
});

app.post('/employee/:id/edit', (req, res) => {
  const id = req.params.id;
  const {
    first_name,
    last_name,
    email,
    mobile,
    dob,
    gender,
    address,
    country,
    city,
    other_city,
    skills,
  } = req.body;

  const countries = ['India', 'USA', 'UK'];
  const cities = ['Hyderabad', 'Bangalore', 'Chennai', 'Pune'];
  const allSkills = ['AWS', 'QA-Automation', 'DevOps', 'WebServices', 'Full Stack Developer', 'Middleware'];

  const errors = [];
  if (!first_name || !first_name.trim()) errors.push('First Name is required');
  if (!email || !email.trim()) errors.push('Email is required');

  const skillsValue = Array.isArray(skills) ? skills.join(',') : skills || '';

  if (errors.length) {
    return res.status(400).render('employee-edit', {
      user: req.session?.user || null,
      employee: { id, ...req.body },
      errors,
      countries,
      cities,
      skills: allSkills,
    });
  }

  db.run(
    `UPDATE employee_profiles
     SET first_name = ?, last_name = ?, email = ?, mobile = ?, dob = ?, gender = ?, address = ?, country = ?, city = ?, other_city = ?, skills = ?
     WHERE id = ?`,
    [
      first_name.trim(),
      last_name ? last_name.trim() : null,
      email.trim(),
      mobile || null,
      dob || null,
      gender || null,
      address || null,
      country || null,
      city || null,
      other_city || null,
      skillsValue,
      id,
    ],
    function (err) {
      if (err) {
        return res.status(500).render('employee-edit', {
          user: req.session?.user || null,
          employee: { id, ...req.body },
          errors: ['Could not update employee profile.'],
          countries,
          cities,
          skills: allSkills,
        });
      }
      res.redirect('/employee/search');
    }
  );
});

app.post('/employee/:id/delete', (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM employee_profiles WHERE id = ?', [id], function (err) {
    if (err) {
      return res.status(500).send('Could not delete employee');
    }
    res.redirect('/employee/search');
  });
});

app.post('/employees/:id', (req, res) => {
  const { name, email, department, salary, status } = req.body;
  db.run(
    'UPDATE employees SET name = ?, email = ?, department = ?, salary = ?, status = ? WHERE id = ?',
    [name, email, department, salary || null, status || 'Active', req.params.id],
    function (err) {
      if (err) {
        return res.status(400).render('employees-form', {
          user: req.session?.user || null,
          employee: { id: req.params.id, ...req.body },
          error: 'Could not update employee (maybe duplicate email).',
        });
      }
      res.redirect('/employees');
    }
  );
});

app.post('/employees/:id/delete', (req, res) => {
  db.run('DELETE FROM employees WHERE id = ?', [req.params.id], function (err) {
    if (err) {
      return res.status(500).send('Could not delete employee');
    }
    res.redirect('/employees');
  });
});

// REST-style JSON APIs for the same entity (shows API skills)
app.get('/api/employees', (req, res) => {
  db.all('SELECT * FROM employees', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Error loading employees' });
    }
    res.json(rows);
  });
});

app.get('/api/employees/:id', (req, res) => {
  db.get('SELECT * FROM employees WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Error loading employee' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json(row);
  });
});

app.post('/api/employees', (req, res) => {
  const { name, email, department, salary, status } = req.body;
  db.run(
    'INSERT INTO employees (name, email, department, salary, status) VALUES (?, ?, ?, ?, ?)',
    [name, email, department, salary || null, status || 'Active'],
    function (err) {
      if (err) {
        return res.status(400).json({ error: 'Could not create employee' });
      }
      res.status(201).json({ id: this.lastID, name, email, department, salary, status });
    }
  );
});

app.put('/api/employees/:id', (req, res) => {
  const { name, email, department, salary, status } = req.body;
  db.run(
    'UPDATE employees SET name = ?, email = ?, department = ?, salary = ?, status = ? WHERE id = ?',
    [name, email, department, salary || null, status || 'Active', req.params.id],
    function (err) {
      if (err) {
        return res.status(400).json({ error: 'Could not update employee' });
      }
      res.json({ id: req.params.id, name, email, department, salary, status });
    }
  );
});

app.delete('/api/employees/:id', (req, res) => {
  db.run('DELETE FROM employees WHERE id = ?', [req.params.id], function (err) {
    if (err) {
      return res.status(500).json({ error: 'Could not delete employee' });
    }
    res.status(204).send();
  });
});

app.get('/admin/login', (req, res) => {
  res.render('admin-login', { error: null });
});

app.get('/forgot-password', (req, res) => {
  res.render('forgot-password');
});

// "More" menu options (simple but shows different UI / logic)
app.get('/more', (req, res) => {
  res.render('more', { user: req.session?.user || null });
});

app.get('/more/links', (req, res) => {
  res.render('more-links', { user: req.session?.user || null });
});

app.get('/more/slider', (req, res) => {
  res.render('more-slider', { user: req.session?.user || null });
});

app.get('/more/autocomplete', (req, res) => {
  res.render('more-autocomplete', { user: req.session?.user || null });
});

app.get('/more/tabs', (req, res) => {
  res.render('more-tabs', { user: req.session?.user || null });
});

app.get('/more/menu', (req, res) => {
  res.render('more-menu', { user: req.session?.user || null });
});

app.get('/more/collapsible', (req, res) => {
  res.render('more-collapsible', { user: req.session?.user || null });
});

// Image upload/download (More -> Images)
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const safeName = file.originalname.replace(/\s+/g, '_');
    cb(null, Date.now() + '_' + safeName);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  },
});

app.get('/more/images', (req, res) => {
  fs.readdir(uploadDir, (err, files) => {
    const images = !err
      ? files.filter((f) => /\.(png|jpe?g|gif|webp)$/i.test(f))
      : [];

    res.render('more-images', {
      user: req.session?.user || null,
      images,
      error: null,
    });
  });
});

app.post('/more/images', upload.single('image'), (req, res) => {
  if (!req.file) {
      return fs.readdir(uploadDir, (err, files) => {
        const images = !err
          ? files.filter((f) => /\.(png|jpe?g|gif|webp)$/i.test(f))
          : [];
        res.status(400).render('more-images', {
          user: req.session?.user || null,
          images,
          error: 'Please select an image file to upload.',
        });
      });
  }

  res.redirect('/more/images');
});

app.get('/more/tooltips', (req, res) => {
  res.render('more-tooltips', { user: req.session?.user || null });
});

app.get('/more/popups', (req, res) => {
  res.render('more-popups', { user: req.session?.user || null });
});

app.get('/more/css-properties', (req, res) => {
  res.render('more-css-properties', { user: req.session?.user || null });
});

app.get('/more/iframes', (req, res) => {
  res.render('more-iframes', { user: req.session?.user || null });
});

// iFrame content routes
app.get('/iframe/frame-one', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Frame One</title>
      <style>
        body { margin:0; padding:0; display:flex; align-items:center; justify-content:center; height:100vh; font-family:sans-serif; }
      </style>
    </head>
    <body>
      <h1>Frame One</h1>
    </body>
    </html>
  `);
});

app.get('/iframe/frame-two', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Frame Two</title>
      <style>
        body { margin:0; padding:0; font-family:sans-serif; }
        .header { background:#1d4ed8; color:white; padding:1rem; text-align:center; }
        .nav { background:#1d4ed8; color:white; padding:0.5rem 1rem; display:flex; justify-content:space-between; align-items:center; }
        .content { padding:2rem; text-align:center; min-height:300px; }
        .footer { text-align:center; padding:1rem; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Frame Two</h1>
      </div>
      <div class="nav">
        <span>☰</span>
        <span>□→</span>
      </div>
      <div class="content">
        <div style="background:#1d4ed8; color:white; padding:1rem; margin-bottom:1rem; border-radius:0.25rem;">
          <h2 style="margin:0;">Magnus</h2>
        </div>
        <p>Welcome to JALA Academy</p>
      </div>
      <div class="footer">
        <h2>Frame Three</h2>
      </div>
    </body>
    </html>
  `);
});

app.get('/iframe/frame-three', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Frame Three</title>
      <style>
        body { margin:0; padding:0; display:flex; align-items:center; justify-content:center; height:100vh; font-family:sans-serif; }
      </style>
    </head>
    <body>
      <h1>Frame Three</h1>
    </body>
    </html>
  `);
});

app.get('/more/settings', (req, res) => {
  const settings = req.session?.settings || {};
  res.render('more-settings', {
    user: req.session?.user || null,
    settings,
    success: null,
    errors: [],
  });
});

app.post('/more/settings', (req, res) => {
  const {
    displayName,
    email,
    bio,
    emailNotifications,
    pushNotifications,
    smsNotifications,
    theme,
    language,
    timezone,
    profileVisibility,
    twoFactorAuth,
    sessionTimeout,
  } = req.body;

  const errors = [];
  if (!displayName || !displayName.trim()) {
    errors.push('Display Name is required');
  }
  if (!email || !email.trim()) {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Invalid email format');
  }

  if (errors.length) {
    return res.status(400).render('more-settings', {
      user: req.session?.user || null,
      settings: req.body,
      success: null,
      errors,
    });
  }

  // Save settings to session (in production, save to database)
  req.session.settings = {
    displayName: displayName.trim(),
    email: email.trim(),
    bio: bio || '',
    emailNotifications: emailNotifications === 'on',
    pushNotifications: pushNotifications === 'on',
    smsNotifications: smsNotifications === 'on',
    theme: theme || 'light',
    language: language || 'en',
    timezone: timezone || 'UTC',
    profileVisibility: profileVisibility === 'on',
    twoFactorAuth: twoFactorAuth === 'on',
    sessionTimeout: parseInt(sessionTimeout) || 30,
  };

  // Update user email in session if changed
  if (req.session?.user) {
    req.session.user.email = email.trim();
  }

  res.render('more-settings', {
    user: req.session?.user || null,
    settings: req.session.settings,
    success: 'Settings saved successfully!',
    errors: [],
  });
});

const PORT = process.env.PORT || 3000;

// For Vercel deployment, only listen if not in serverless environment
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`JALA Magnus clone running on http://localhost:${PORT}`);
  });
}

module.exports = app;
