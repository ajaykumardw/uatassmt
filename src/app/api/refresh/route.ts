import { NextResponse } from "next/server";

import { sign, verify, type JwtPayload, type SignOptions} from "jsonwebtoken";

export async function POST(req: Request) {
  const { refreshToken } = await req.json();

  if (!refreshToken) {
    return NextResponse.json(
      { status: 'Error', statusCode: 400, message: 'Missing refresh token' },
      { status: 400 }
    );
  }

  try {
    const decoded = verify(refreshToken, process.env.NEXTAUTH_SECRET as string) as JwtPayload;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { exp, iat, ...payload } = decoded;

    const newAccessToken = sign(
      payload,
      process.env.NEXTAUTH_SECRET as string,
      { expiresIn: (process.env.ACCESS_TOKEN_EXPIRATION as SignOptions['expiresIn']) || '1h' }
    );

    return NextResponse.json({
      status: 'Success',
      statusCode: 200,
      message: 'New access token generated successfully',
      data: {
        accessToken: newAccessToken
      }
    });

  } catch(err: any) {

    const message = err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';

    return NextResponse.json({
      status: 'Error',
      statusCode: 403,
      message: message,
    }, { status: 403 });

  }
}
