import { signupService, signinService, googleAuthService, TOKEN_TTL_SECONDS } from '../services/auth.service.js';

export const authCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
};

export const signup = async (req, res, next) => {
  try {
    await signupService(req.body);
    res.json('Signup successful');
  } catch (error) {
    next(error);
  }
};

export const signin = async (req, res, next) => {
  try {
    const { token, user } = await signinService(req.body);
    res
      .status(200)
      .cookie('access_token', token, { ...authCookieOptions, maxAge: TOKEN_TTL_SECONDS * 1000 })
      .json(user);
  } catch (error) {
    next(error);
  }
};

export const google = async (req, res, next) => {
  try {
    const { token, user } = await googleAuthService(req.body);
    res
      .status(200)
      .cookie('access_token', token, { ...authCookieOptions, maxAge: TOKEN_TTL_SECONDS * 1000 })
      .json(user);
  } catch (error) {
    next(error);
  }
};
