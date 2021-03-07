const crypto = require('crypto');
const {promisify} = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

const signToken = id => {
  return jwt.sign({id}, process.env.JWT_SECRET, {expiresIn: process.env.JWT_EXPIRES_IN})
}

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id)
  const cookieOptions = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000), 
    httpOnly: true
  }

  if(process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions)

  // Remove password from output 
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  })
}

exports.signup = catchAsync(async (req,res, next) => {
  const newUser = await User.create(req.body);

  createSendToken(newUser,201,res)
})


exports.login = catchAsync(async (req,res,next) => {
  const {email, password} = req.body;

  if(!email || !password) {
    return next(new AppError('Please provide email and password!',400))
  }

  const user = await User.findOne({email}).select('+password')
  const correct = await user.correctPassword(password, user.password)

  if(!user || !correct) {
    return next(new AppError('Incorrect email or password', 401))
  }

  createSendToken(user, 200, res)
  // const token = signToken(user._id);
  // res.status(200).json({
    // status: 'success',
    // token,
  // })
})

exports.protect = catchAsync(async(req,res,next)=> {
  // Getting token and check of it's there
  let token;
  if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1]
  }
  if(!token) {
    return next(new AppError('You are not logged in! Please log in to get access.',401))
  }

  // Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)

// Check if user still exists
  const currentUser = await User.findById(decoded.id)
  if(!currentUser) {
    return next(new AppError('The user belonging to this token does  no longer exist', 401))
  }
  if(currentUser.changePasswordAfter(decoded.iat)) {
    return next(new AppError('User recently changed password! Please log in again.', 401))
  }

  // Grant access to protectd route
  req.user = currentUser;
  console.log(req.user);
  next()
})


exports.restrictTo = (...roles)=> {
  return (req,res,next) => {
    console.log(roles.includes(req.user.role));
    if(!roles.includes(req.user.role)){
      return next(new AppError("You don't have permissions to perform this action.", 403))
        // 
      }
    next();
  }
}

exports.forgotPassword = catchAsync(async(req,res,next) => {
  // Get user based on POSTed email
  const user = await User.findOne({email: req.body.email})
  if(!user) {
    return next(new AppError('Нет пользователя с таким адресом электронной почты', 404))
  }
  // Generate the random reset token
  const resetToken = user.createPasswordResetToken()
  // console.log(user);
  await user.save({validateBeforeSave: false})
  // Send it to user's email 
  const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`; 
  // console.log(resetURL);

  const message = `Забыли Ваш пароль? Отправьте запрос с новым паролем и подтвердите пароль в: ${resetURL}.\nЕсли вы не забыли свой пароль, не обращайте внимания на это письмо!
  `;
  
  try {
    await sendEmail({
      email: user.email,
      subject: 'Токен для сброса пароля (действует 10 мин.)',
      message
    });

    res.status(200).json({
      status: 'success',
      message: 'Токен отправлен на почту!'
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('При отправке электронного письма произошла ошибка. Попробуйте позже!'),
      500
    );
  }
});


exports.resetPasswords = catchAsync(async(req,res,next) => {
// get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken, 
    passwordResetExpires: {$gt: Date.now()}
  }); 
  console.log(user);
  // if token has not expired, and there is user, set the new   password 
  if(!user) {
    return next(new AppError('Token is invalid or has expired', 400))
  }
  console.log(req.body);
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save()
  // Update changedPasswordAt  property for the user

  // Log the user in, send JWT
  createSendToken(user, 200, res)
});

exports.updatePassword = catchAsync(async(req,res,next) => {
  // Get user from collection 
  const user = await User.findById(req.user.id).select('+password');

  // check if POSTed current password is correct
  if(!(await user.correctPassword(req.body.passwordCurrent, user.password))){
    return next(new AppError('Ваш текущий пароль неверен', 401))
  }


  // if so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();


  // log user in, send JWT
  createSendToken(user, 200, res)
})