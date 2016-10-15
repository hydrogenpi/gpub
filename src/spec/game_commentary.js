goog.provide('gpub.spec.GameCommentary');

/**
 * @param {!glift.rules.MoveTree} mt The movetree for the position.
 * @param {!gpub.spec.Position} position The position used for spec generation.
 * @param {!gpub.spec.IdGen} idGen
 * @return {!gpub.spec.Generated} processed positions.
 * @package
 */
gpub.spec.processGameCommentary = function(mt, position, idGen) {
  // TODO(kashomon): This should be refactored to be much simpler (more like the
  // problem-code).
  var varPathBuffer = [];
  var node = mt.node();
  var ipString = glift.rules.treepath.toInitPathString;
  var fragString = glift.rules.treepath.toFragmentString;
  var alias = position.alias;

  var gen = new gpub.spec.Generated({
    id: position.id
  });
  gen.labels['MAINLINE'] = [];
  gen.labels['VARIATION'] = [];

  while (node) {
    if (!mt.properties().getComment() && node.numChildren() > 0) {
      // Ignore positions don't have comments and aren't terminal.
      // We ignore the current position, but if there are variations, we note
      // them so we can process them after we record the next comment.
      node = mt.node();
      varPathBuffer = varPathBuffer.concat(gpub.spec.variationPaths(mt));
    } else {
      // This node has a comment or is terminal.  Process this node and all
      // the variations.
      var pathSpec = glift.rules.treepath.findNextMovesPath(mt);
      var pos = new gpub.spec.Position({
          id: idGen.next(),
          alias: alias,
          initialPosition: ipString(pathSpec.treepath),
          nextMovesPath: fragString(pathSpec.nextMoves),
      })
      gen.positions.push(pos);
      gen.labels['MAINLINE'].push(pos.id);

      varPathBuffer = varPathBuffer.concat(
          gpub.spec.variationPaths(mt));
      for (var i = 0; i < varPathBuffer.length; i++) {
        var path = varPathBuffer[i];
        var mtz = mt.getTreeFromRoot(path);
        var varPathSpec = glift.rules.treepath.findNextMovesPath(mtz);
        var varPos = new gpub.spec.Position({
            id: idGen.next(),
            alias: alias,
            initialPosition: ipString(varPathSpec.treepath),
            nextMovesPath: fragString(varPathSpec.nextMoves),
        });
        gen.positions.push(varPos);
        gen.labels['VARIATION'].push(varPos.id);
      }
      varPathBuffer = [];
    }
    // Travel down along the mainline. Advance both the node and the movetree
    // itself. It's worth noting that getChild() returns null if there are no
    // children, thus terminating flow.
    node = node.getChild(0);
    mt.moveDown();
  }

  return gen;
};

/**
 * Get the next-move treepaths for a particular root node.
 * path.
 *
 * @param {!glift.rules.MoveTree} mt
 * @return {!Array<!glift.rules.Treepath>}
 */
gpub.spec.variationPaths = function(mt) {
  mt = mt.newTreeRef();
  var out = [];
  var node = mt.node();
  if (!node.getParent()) {
    // There shouldn't variations an the root, so just return.
    return out;
  }

  mt.moveUp();

  // Look at all non-mainline variations
  for (var i = 1; i < mt.node().numChildren(); i++) {
    var mtz = mt.newTreeRef();
    mtz.moveDown(i);
    mtz.recurse(function(nmtz) {
      if (!nmtz.properties().getComment()) {
        return; // Must have a comment to return the variation.
      }
      out.push(nmtz.treepathToHere());
    });
  }

  return out;
};
