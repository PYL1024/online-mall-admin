localStorage.setItem(
  'TOKEN_KEY',
  'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiIxOSIsInJvbGUiOjIsImlhdCI6MTc2NTkzNDIzNSwiZXhwIjo0NzE3OTM0MjM1fQ.8k2ps1_BU2-Zpjr8XsR-zs9z6hPA-8fv6S5-sN3FLqRBFFkBif4EuUt1tnWL6lDA08nLIswecX10yyH7MOkd_Q',
)

/**
 * 获取 Token
 */
export function getToken(): string | null {
  return localStorage.getItem('TOKEN_KEY')
}

/**
 * 设置 Token
 */
export function setToken(token: string): void {
  localStorage.setItem('TOKEN_KEY', token)
}

/**
 * 移除 Token
 */
export function removeToken(): void {
  localStorage.removeItem('TOKEN_KEY')
}

/**
 * 检查是否已登录
 */
export function isAuthenticated(): boolean {
  return !!getToken()
}
