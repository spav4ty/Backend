const crypto = require('crypto')
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name!']
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true
  },
  photo: String,
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user'
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      validator: function (el) {
        return el === this.password
      },
      message: 'Passwords are not the same!'
    }
  },
  passwordChangedAt: {
    type: Date,
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false
  }
});

userSchema.pre('save', async function(next){
  // запускать эту функцию только в том случае, если пароль действительно был изменен
  if(!this.isModified('password')) return next()

  this.password = await bcrypt.hash(this.password, 12)
  this.passwordConfirm = undefined;
  next();
})

userSchema.pre('save', function(next){
  if (!this.isModified('password') || this.isNew){
    return next()
  }

  this.passwordChangedAt = Date.now() - 1000;
  next()
})

userSchema.pre(/^find/, function (next) {
  this.find({active: {$ne:false}})
  next()
})

userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword)
}

userSchema.methods.changePasswordAfter = function (JWTTimestamp) {
  if(this.passwordChangedAt){
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime()/1000,
      10
    ); 
    return JWTTimestamp < changedTimestamp
  }
  return false;
}


userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex')

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; 

  return resetToken;
}

const User = mongoose.model('User', userSchema)

module.exports = User;