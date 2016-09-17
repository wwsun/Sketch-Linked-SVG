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
    filePath = path.toString().replace("file:///","");
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
    var docUrlParts = docDir.split('/');
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

  "exportSVG": function(docDir, page, selection) {
    var fromat = MSExportFormat.formatWithScale_name_fileFormat(1.000000, '', 'svg')
    var option = MSExportOptions.new();
    option.setExportFormats([fromat]);
    var colorSpace = [NSColorSpace sRGBColorSpace];
    var request;
    var exportedData;
    var exporter;

    if ([selection count] > 0) {
      var tempPage = page.duplicate();
      tempPage.removeAllLayers()
      tempPage.addLayers(selection);
      tempPage.setPrimitiveExportOptions(option);
      request = MSExportRequest.exportRequestsFromExportableLayer(tempPage).firstObject();
      tempPage = nil;
    } else {
      page.setPrimitiveExportOptions(option);
      request = MSExportRequest.exportRequestsFromExportableLayer(page).firstObject();
    }
    exporter = MSExportRendererWithSVGSupport.exporterForRequest_colorSpace(request, colorSpace);
    exportedData = exporter.data();

    // openSaveFileDialog asks the user the path to save the export file.
    var exportPath = this.openSaveFileDialog(docDir, request.name()+'.svg');
    // save exported SVG data to the specified path.
    if (exportPath) {
      exportedData.writeToFile_atomically(this.util.decodeString(exportPath), true);
    }
  },

  "importSVG": function(container, name, url) {
    var svgImporter = MSSVGImporter.svgImporter();
    svgImporter.prepareToImportFromURL(url);
    var layer = svgImporter.importAsLayer();
    layer.name = name;
    layer.firstLayer().ungroup();
    [container addLayers:[layer]];
    layer.select_byExpandingSelection(true, false);
  },

  "openSVG": function(page, url) {
    var fileName = url.absoluteString().split('/').pop();
    var fileNameParts = fileName.split('.');
    var fileFormat = fileNameParts.pop();
    if (fileFormat != 'svg'){
      LinkedSVG.util.displayAlert("Cannot Open ."+fileFormat+" file","Please select a SVG file.");
      return;
    }
    var svgImporter = MSSVGImporter.svgImporter();
    svgImporter.prepareToImportFromURL(url);
    var layer = svgImporter.importAsLayer();
    layer.name = fileNameParts.shift();
    layer.firstLayer().ungroup();
    [page addLayers:[layer]];
    layer.select_byExpandingSelection(true, false);
  },

  "saveSVG": function(doc, page) {
    var fromat = MSExportFormat.formatWithScale_name_fileFormat(1.000000, '', 'svg')
    var option = MSExportOptions.new();
    option.setExportFormats([fromat]);
    page.setPrimitiveExportOptions(option);
    var colorSpace = [NSColorSpace sRGBColorSpace];
    var request = MSExportRequest.exportRequestsFromExportableLayer(page).firstObject();
    var exporter = MSExportRendererWithSVGSupport.exporterForRequest_colorSpace(request, colorSpace);
    var exportedData = exporter.data();
    var exportPath = [doc fileURL];
    if(exportPath){
      exportPath = exportPath.toString().replace('.sketch', '.svg');
      exportPath = exportPath.toString().replace('file://', '');
      exportedData.writeToFile_atomically(this.util.decodeString(exportPath), true);
    } else {
      exportPath = this.openSaveFileDialog(nil, request.name()+'.svg');
      exportedData.writeToFile_atomically(this.util.decodeString(exportPath), true);
    }
    doc.showMessage('Successfully saved to "'+exportPath.toString()+'"');
  },

  "updateSVG": function(layer, url) {
    layer.removeAllLayers();
    var svgImporter = MSSVGImporter.svgImporter();
    svgImporter.prepareToImportFromURL(url);
    var tempLayer = svgImporter.importAsLayer();
    var importedLayer = tempLayer.ungroup()[0];
    var outerFrame = layer.frame();
    var importedLayerGroupFrame = importedLayer.frame();
    importedLayerGroupFrame.setWidth(outerFrame.width());
    importedLayerGroupFrame.setHeight(outerFrame.height());
    [layer addLayers:[importedLayer]];
    layer.firstLayer().ungroup();
  },

  "makeLayerName": function(filePath, docPath) {
    var svgRelativeUrl = this.getRelativePathToDoc(filePath,docPath);
    return LinkedSVG_prefix + this.util.decodeString(svgRelativeUrl);
  },

  "openSaveFileDialog": function(path, name){
    var openDlg = NSSavePanel.savePanel();
    openDlg.setTitle('Export SVG In…');
    openDlg.setCanChooseFiles(false);
    openDlg.setCanChooseDirectories(true);
    openDlg.allowsMultipleSelection = false;
    openDlg.setCanCreateDirectories(true);
    openDlg.setNameFieldStringValue(name);
    if (path) {
      openDlg.setDirectoryURL(NSURL.fileURLWithPath(path));
    }
    var buttonClicked = openDlg.runModal();
    if (buttonClicked == NSOKButton) {
      return openDlg.URL().toString().replace("file://","");
    }
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
    if (filePath) {
      [openPanel setDirectoryURL:[NSURL fileURLWithPath:filePath]]];
    }
    [[NSApplication sharedApplication] activateIgnoringOtherApps:true];
    var openPanelButtonPressed = [openPanel runModal];
    if (openPanelButtonPressed == NSFileHandlingPanelOKButton) {
      selectedFile = [openPanel URLs];
      return selectedFile;
    } else {
      return false;
    }
  },

  "util": {
    "encodeString": function(tempString) {
      var inputNSString = [[NSString alloc] initWithString:tempString];
      var encodedNSString = [inputNSString stringByAddingPercentEscapesUsingEncoding:NSUTF8StringEncoding];
      return encodedNSString.toString();
    },
    "decodeString": function(tempString) {
      var inputNSString = [[NSString alloc] initWithString:tempString];
      var decodedNSString = [inputNSString stringByReplacingPercentEscapesUsingEncoding:NSUTF8StringEncoding];
      return decodedNSString.toString();
    },
    "displayAlert": function(title, text) {
      var app = [NSApplication sharedApplication];
      [app displayDialog:text withTitle:title];
    },
    "parseSVG": function(rawData) {
      var svgString = [[NSString alloc] initWithData:rawData encoding:NSUTF8StringEncoding];
      // svgString = this.collapseStartingGroupTag(svgString);
      // svgString = this.removeClosingGroupTag(svgString);
      return [svgString dataUsingEncoding:NSUTF8StringEncoding];
    },
    "removeClosingGroupTag": function(svgString) {
      var regex = NSRegularExpression.regularExpressionWithPattern_options_error("</g(.*?)>", NSRegularExpressionAnchorsMatchLines, nil);
      var searchRange = NSMakeRange(0, svgString.length());
      var matched = regex.matchesInString_options_range(svgString, 0, searchRange);
      var foundRange = matched.lastObject();
      return regex.stringByReplacingMatchesInString_options_range_withTemplate(svgString, 0, foundRange.range(), '');
    },
    "collapseStartingGroupTag": function(svgString) {
      // find the first g tag and delete it from svgString
      var regexForStartingGroupTag = NSRegularExpression.regularExpressionWithPattern_options_error("<g(.*?)>", NSRegularExpressionAnchorsMatchLines, nil);
      var searchRange = NSMakeRange(0, svgString.length());
      var matched = regexForStartingGroupTag.matchesInString_options_range(svgString, 0, searchRange);
      var foundRange = matched.objectAtIndex(0);
      var firstStartingGroupTag = svgString.substringWithRange(foundRange.rangeAtIndex(0));
      svgString = svgString.stringByReplacingOccurrencesOfString_withString(firstStartingGroupTag, '');

      // find the second g tag
      searchRange = NSMakeRange(0, svgString.length());
      matched = regexForStartingGroupTag.matchesInString_options_range(svgString, 0, searchRange);
      foundRange = matched.objectAtIndex(0);
      var secondStartingGroupTag = svgString.substringWithRange(foundRange.rangeAtIndex(0));

      // strip the firt two g tag and combine them
      var regexForID = NSRegularExpression.regularExpressionWithPattern_options_error("<g\ (.*?)\ ", NSRegularExpressionAnchorsMatchLines, nil);
      searchRange = NSMakeRange(0, firstStartingGroupTag.length());
      matched = regexForID.matchesInString_options_range(firstStartingGroupTag, 0, searchRange);
      foundRange = matched.objectAtIndex(0);
      result = firstStartingGroupTag.substringWithRange(foundRange.rangeAtIndex(0));
      var headlessGroupTag = firstStartingGroupTag.stringByReplacingOccurrencesOfString_withString(result, '');
      //combine the first two stripped down starting groups
      var newGroupTag = secondStartingGroupTag.stringByReplacingOccurrencesOfString_withString('>', ' ').stringByAppendingString(headlessGroupTag);
      newGroupTag = this.avoidAttrRedefine(newGroupTag);

      return svgString.stringByReplacingOccurrencesOfString_withString(secondStartingGroupTag, newGroupTag);
    },
    "avoidAttrRedefine": function(tagString) {
      //define the regex to use to remove from the tagString
      var regexStroke = NSRegularExpression.regularExpressionWithPattern_options_error("\ stroke=\".*?\"", NSRegularExpressionAnchorsMatchLines, nil);
      var regexstrokeWidth = NSRegularExpression.regularExpressionWithPattern_options_error("\ stroke-width=\".*?\"", NSRegularExpressionAnchorsMatchLines, nil);
      var regexFill = NSRegularExpression.regularExpressionWithPattern_options_error("\ fill=\".*?\"", NSRegularExpressionAnchorsMatchLines, nil);
      var regexFillRule = NSRegularExpression.regularExpressionWithPattern_options_error("\ fill-rule=\".*?\"", NSRegularExpressionAnchorsMatchLines, nil);
      
      //make sure there is no redefined stroke attribute
      tagString = this.regexRemove(tagString, regexStroke);
      //make sure there is no redefined stroke-width attribute
      tagString = this.regexRemove(tagString, regexstrokeWidth);
      //make sure there is no redefined fill attribute
      tagString = this.regexRemove(tagString, regexFill);
      //make sure there is no redefined fill-rule attribute
      tagString = this.regexRemove(tagString, regexFillRule);

      return tagString;
    },
    "regexRemove": function(string, regex) {
      var searchRange = NSMakeRange(0, string.length());
      var matched = regex.matchesInString_options_range(string, 0, searchRange);
      while (matched.count() > 1) {
        var foundRange = matched.objectAtIndex(1);
        string = string.stringByReplacingCharactersInRange_withString(foundRange.rangeAtIndex(0), '');
        searchRange = NSMakeRange(0, string.length());
        matched = regex.matchesInString_options_range(string, 0, searchRange);
      }
      return string;
    }
  }
};