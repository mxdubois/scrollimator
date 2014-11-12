module.exports = setupFixture;

function setupFixture() {
  beforeEach(function() {
    this.document = document;
    this.window = window;
  });

  afterEach(function() {
    //this.window.close();
  });
}
