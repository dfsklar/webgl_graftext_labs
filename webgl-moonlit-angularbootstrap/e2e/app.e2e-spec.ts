import { WebglMoonlitAngularbootstrapPage } from './app.po';

describe('webgl-moonlit-angularbootstrap App', () => {
  let page: WebglMoonlitAngularbootstrapPage;

  beforeEach(() => {
    page = new WebglMoonlitAngularbootstrapPage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Welcome to app!');
  });
});
