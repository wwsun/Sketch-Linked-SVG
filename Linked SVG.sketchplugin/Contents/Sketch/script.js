var LinkedSVG = {

  "findAllMarkedLayers": function(context, layers) {
    var command = context.command;
    var foundLayers = [];
    for (var i = 0; i < [layers count]; i++) {
      var layer = layers[i];
      if (layer.name().startsWith('@@')) {
        foundLayers.push(layer);
      }
    }
    return foundLayers;
  },

  "getDirectory": function(path) {
    filePath = path.toString();
    var filePathParts = filePath.split('/');
    filePathParts.pop();
    return filePathParts.join('/') + '/';
  },

  "getRelativePathToDoc": function(svgURL, docURL) {
    var svgUrlFrag = svgURL.replace("file:///","").split('/');
    var docUrlFrag = docURL.replace("file:///","").split('/');
    var svgUrlFragCopy = svgURL.replace("file:///","").split('/');
    var docUrlFragCopy = docURL.replace("file:///","").split('/');

    for (var i = 0; i < svgUrlFragCopy.length; i++) {
      if (svgUrlFragCopy[i] == docUrlFragCopy[i]) {
        svgUrlFrag.shift();
        docUrlFrag.shift();
      } 
    }
    var relativeSvgPath = '';
    for (var i = 0; i < docUrlFrag.length-1; i++) {
      relativeSvgPath += '../';
    }
    relativeSvgPath += svgUrlFrag.join('/');

    return relativeSvgPath;
  },

  "expandRelativePath": function(relativeFileURL,docDir) {
    var fileUrlParts = relativeFileURL.split('/');
    var docUrlParts = docDir.replace("file:///","").split('/');
    docUrlParts.pop();
    var fileUrlPartsCopy = relativeFileURL.split('/');

    for (var i = 0; i < fileUrlPartsCopy.length; i++) {
      if (fileUrlPartsCopy[i] == '..') {
        fileUrlParts.shift();
        docUrlParts.pop();
      }
    }

    return "file:///" + docUrlParts.join('/') + '/' + fileUrlParts.join('/');
  },

  "makeSvgLayerGroup": function(container, name, url) {
    // Set up the SVG Importer
    var svgImporter = MSSVGImporter.svgImporter();
    // MSDocumentImporter.importFromURL_inGroup_importer(url, container, svgImporter);
    var layer = MSLayerGroup.new();
    layer.initWithFrame(NSMakeRect(0, 0, 100, 100));
    layer.name = name;
    MSDocumentImporter.importFromURL_inGroup_importer(url, layer, svgImporter);
    layer.resizeToFitChildrenWithOption(0);
    [container addLayers:[layer]];
    layer.select_byExpandingSelection(true, false);
  },

  "makeLayerName": function(filePath, docPath) {
    var svgRelativeUrl = this.getRelativePathToDoc(filePath,docPath);
    return LinkedSVG_prefix + this.util.decodeString(svgRelativeUrl);
  },

  "openPanelMultiple": function(filePath, message, prompt, title) {
    var openPanel = [NSOpenPanel openPanel];
    [openPanel setMessage:message];
    [openPanel setPrompt:prompt];
    [openPanel setTitle:title];
    [openPanel setCanCreateDirectories:false];
    [openPanel setCanChooseFiles:true];
    [openPanel setCanChooseDirectories:false];
    [openPanel setAllowsMultipleSelection:true];
    [openPanel setShowsHiddenFiles:false];
    [openPanel setExtensionHidden:false];
    [openPanel setDirectoryURL:[NSURL fileURLWithPath:filePath]]];
    [[NSApplication sharedApplication] activateIgnoringOtherApps:true];
    var openPanelButtonPressed = [openPanel runModal];
    if (openPanelButtonPressed == NSFileHandlingPanelOKButton) {
      selectedFile = [openPanel URLs];
      return selectedFile;
    } else {
      return false;
    }
  },

  "updateSvgLayerGroup": function(layer, url) {
    layer.removeAllLayers();
    var svgImporter = MSSVGImporter.svgImporter();
    MSDocumentImporter.importFromURL_inGroup_importer(url, layer, svgImporter);
  },

  "util": {
    "decodeString": function(tempString) {
      var inputNSString = [[NSString alloc] initWithString:tempString];
      var decodedNSString = [inputNSString stringByReplacingPercentEscapesUsingEncoding:NSUTF8StringEncoding];
      return decodedNSString.toString();
    },
    "displayAlert": function(title, text) {
      var app = [NSApplication sharedApplication];
      [app displayDialog:text withTitle:title];
    }
  }
};