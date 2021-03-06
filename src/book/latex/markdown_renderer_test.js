(function() {
  module('gpub.book.latex.rendererTest');
  var render = gpub.book.latex.renderMarkdown;

  var pend = gpub.book.latex.MarkdownBase.prototype.paragraph('');

  test('Testing header (preamble) + body', function() {
    deepEqual(render('#foo\nbar'), {
      preamble: '\\part{foo}',
      text: 'bar' + pend
    });
  });

  test('No sanitize', function() {
    deepEqual(render('\'bar\''), {
      preamble: '',
      text: '\'bar\'' + pend
    });
  });

  test('Header: top', function() {
    deepEqual(render('# bar'), {
      preamble: '\\part{bar}',
      text: ''
    });
  });

  test('Italics', function() {
    deepEqual(render('*bar*'), {
      preamble: '',
      text: '\\textit{bar}' + pend
    });
  });

  // Note: Renderer gets confused here.
  // test('italics + space', function() {
    // deepEqual(render('* bar*'), {
      // preamble: '',
      // text: '\\textbf{ bar}' + pend
    // });
  // });

  test('Strong', function() {
    deepEqual(render('__bar__'), {
      preamble: '',
      text: '\\textbf{bar}' + pend
    });
  });

  test('Realistic', function() {
    deepEqual(render([
        '# Fujisawa and Go',
        '',
        'This was the second game in a ten game match between Fujisawa Hosai 9p'
    ].join('\n')), {
      preamble: '\\part{Fujisawa and Go}',
      text: 'This was the second game in a ten game match between ' +
          'Fujisawa Hosai 9p' + pend
    });
  });

  test('Post-Process # character', function() {
    deepEqual(render('Shusaku is still #1!'), {
      preamble: '',
      text: 'Shusaku is still \\#1!' + pend
    });
  });
})();
