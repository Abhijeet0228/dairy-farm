const bcrypt = require('bcryptjs');

const hash = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8GlBt1QEbBbCCiCmWi';
const password = 'dairy123';

bcrypt.compare(password, hash).then(res => {
  console.log('Match:', res);
});
