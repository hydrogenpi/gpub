gpub.book.latex = {
  /**
   * Generate a LaTeX book!
   *
   * We assume that the options have already been generated.
   */
  generate: function(bookDefinition, templateString, diagramType) {
    if (!bookDefinition) {
      throw new Error('Options must be defined. Was: ' + bookDefinition);
    }
    var diagramsPerPage = 2;

    var templateString = templateString || gpub.templates.latexBase;
    var diagramType = diagramType || gpub.diagrams.diagramType.GOOE

    var mgr = glift.widgets.createNoDraw(bookDefinition);
    var template = gpub.templates.parseLatexTemplate(templateString);
    var diagramTypePkg = gpub.diagrams[glift.enums.toCamelCase(diagramType)];
    var diagramTypeHeaders = diagramTypePkg.latexHeaders;

    var latexDefs = gpub.diagrams.latex;

    template.setExtraPackages(diagramTypeHeaders.packageDef())
        .setDiagramTypeDefs(diagramTypeHeaders.extraDefs())
        .setDiagramWrapperDefs(latexDefs.diagramDefs())
        .setTitleDef(this.basicTitleDef(
            'Relentless',
            'Gu Li vs Lee Sedol',
            ['Younggil An', 'David Ormerod', 'Josh Hoak'],
            'Go Game Guru'));

    var content = [];
    var diagramBuffer = []
    var chapter = 1;
    var part = 1;
    var lastPurpose = null;
    var diagramPurpose = gpub.diagrams.diagramPurpose;
    for (var i = 0; i < mgr.sgfCollection.length; i++) {
      var sgfObj = mgr.loadSgfStringSync(mgr.getSgfObj(i));
      var mt = glift.rules.movetree.getFromSgf(
          sgfObj.sgfString, sgfObj.initialPosition);
      var flattened = glift.flattener.flatten(mt, {
          nextMovesTreepath: sgfObj.nextMovesPath,
          boardRegion: sgfObj.boardRegion
      });

      var nodeData = gpub.book.NodeData.fromContext(
          mt, flattened, sgfObj.metadata, i);

      // Hack the node-data until we get markdown parsing.
      var diagram = gpub.diagrams.forPurpose(
          flattened,
          gpub.diagrams.diagramType.GOOE,
          gpub.book.bookFormat.LATEX,
          nodeData.purpose,
          nodeData);

      if (purpose === diagramPurpose.SECTION_INTRO ||
          purpose === diagramPurpose.GAME_REVIEW_CHAPTER ||
          purpose !== lastPurpose) {
        // Flush the previous buffer centent to the page.
        content.push(gpub.book.latex.renderPage(diagramBuffer));

        diagramBuffer = [];
        diagramBuffer.push(diagram);
        content.push(gpub.book.latex.renderPage(diagramBuffer));
        diagramBuffer = [];
      } else {
        diagramBuffer.push(diagram);
        if (diagramBuffer.length === diagramsPerPage) {
          content.push(gpub.book.latex.renderPage(diagramBuffer));
          diagramBuffer = [];
        }
      }
      lastPurpose = purpose;
    }
    return template.setContent(content.join('\n')).compile();
  },

  /**
   * Generates a basic title.
   *
   * title: title of the book as string
   * author: array of one or several authors as array af string
   * subtitle: the subtitle as string
   * publisher: the publisher as string
   *
   * Note: The LaTeX template expects the command \mainBookTitle.
   *
   * returns: filled in string.
   */
  // TODO(kashomon): Perhaps there should be a 'titles' package. Or perhaps each
  // booktype should get its own sub-package?
  basicTitleDef: function(title, subtitle, authors, publisher) {
    var strbuff = [
      '\\definecolor{light-gray}{gray}{0.55}',
      '\\newcommand*{\\mainBookTitle}{\\begingroup',
      '  \\raggedleft'];
    for (var i = 0; i < authors.length; i++) {
      strbuff.push('  {\\Large ' + authors[i] + '} \\\\')
      if (i === 0) {
        strbuff.push('  \\vspace*{0.5 em}');
      } else if (i < authors.length - 1) {
        strbuff.push('  \\vspace*{0.5 em}');
      }
    }
    return strbuff.concat(['  \\vspace*{5 em}',
      '  {\\textcolor{light-gray}{\\Huge ' + title + '}}\\\\',
      '  \\vspace*{\\baselineskip}',
      '  {\\small \\bfseries ' + subtitle + '}\\par',
      '  \\vfill',
      '  {\\Large ' + publisher + '}\\par',
      '  \\vspace*{2\\baselineskip}',
      '\\endgroup}']).join('\n');
  },

  renderPage: function(buffer) {
    buffer.push('\\newpage');
    return buffer.join('\n');
  }
};
