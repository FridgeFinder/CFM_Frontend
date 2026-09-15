if (typeof global.fetch !== 'function') {
  global.fetch = async () => ({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: async () => ({}),
    text: async () => '',
  });
}

if (typeof global.Response === 'undefined') {
  global.Response = class Response {};
}

if (typeof global.Request === 'undefined') {
  global.Request = class Request {};
}

if (typeof global.Headers === 'undefined') {
  global.Headers = class Headers {};
}
