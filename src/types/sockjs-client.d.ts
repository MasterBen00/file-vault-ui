declare module 'sockjs-client' {
  class SockJS {
    constructor (url: string, _reserved?: any, options?: any)
    close (code?: number, reason?: string): void
    send (data: string): void
    onopen: (e: Event) => void
    onclose: (e: CloseEvent) => void
    onmessage: (e: MessageEvent) => void
    onerror: (e: Event) => void
  }

  export default SockJS
}
