function highlightLink(node) {
  node.a("isTagline", true);
  if (node instanceof ht.Node) {
    setColorByLink(node, "#00E000");
    if (node.getAttrObject().nodeType === "olpPhyPort") {
      const linksId = data.getAttrObject().resData.linksId;
      linksId.forEach((linkId) => {
        setColorByLink(this.dataModel.getDataById(linkId), "#00E000");
      });
    }
  } else {
    data.s("edge.color", this.tagColor);
    highlightLink(data.getSource());
    highlightLink(data.getTarget());
  }
}

function setColorByLink(node, color) {
  const links = node.getEdges()?.toArray() || [];
  links.forEach((link) => {
    if (link.s("edge.color") == color) {
      highlightLink(link);
    }
  });
}

function cancelHighlightLink(node) {
  node.a("isTagline", false);
  if (node instanceof ht.Node) {
    resetColorByLink(node, "#00E000");
    if (node.getAttrObject().nodeType === "olpPhyPort") {
      const linksId = data.getAttrObject().resData.linksId;
      linksId.forEach((linkId) => {
        resetColorByLink(this.dataModel.getDataById(linkId), "#00E000");
      });
    }
  } else {
    data.s("edge.color", "#00E000");
    cancelHighlightLink(data.getSource());
    cancelHighlightLink(data.getTarget());
  }
}

function resetColorByLink(node, color) {
  const links = node.getEdges()?.toArray() || [];
  links.forEach((link) => {
    if (link.s("edge.color") !== color) {
      cancelHighlightLink(link);
    }
  });
}
