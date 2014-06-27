/**********************************************************************************************
    zl_ExplodeShapeLayers
    Copyright (c) 2014 Zack Lovatt. All rights reserved.
    zack@zacklovatt.com
 
    Name: zl_ExplodeShapeLayers
    Version: 2.6
 
    Description:
        This script looks at a selected shape layer and breaks apart all vector
        groups & paths into separate layers. Handy if you're converting AI layers.
        
        If you have general effects applied at the end (fill, stroke, other effects),
        they will remain present on each layer.

        New in v2 is the ability to merge shape layers together. Note that animated
        properties & elements aren't supported. It'll still work, but results will be
        somewhat messy.
        
        In v2.5, you can now choose specific shape groups to explode instead of
        having to explode out everything.
        
        Originally requested by Justin Younger (justinyounger.com)
        Merge functionality requested by Navarro Parker (navarroparker.com)
	
        This script is provided "as is," without warranty of any kind, expressed
        or implied. In no event shall the author be held liable for any damages 
        arising in any way from the use of this script.
        
**********************************************************************************************/

    var zl_ESL__scriptName = "zl_ExplodeShapeLayers";
    
	/****************************** 
        zl_ExplodeShapeLayers()
	
        Description:
        This function contains the main logic for this script.
	 
        Parameters:
        explode - bool, true is explode / false is merge
        useall - bool, whether to use all shape groups (true) or selected
        deleteSource - bool, whether to delete source layers (vs hide)
        centrePoints - bool, whether to centre anchor points
	 
        Returns:
        Nothing.
	******************************/
    function zl_ExplodeShapeLayers(explode, useAll, deleteSource, centrePoints){

        var thisComp = app.project.activeItem;
        app.project.activeItem.selected = true;
        var userLayers = thisComp.selectedLayers;
        
        if (explode == true){ // Explode!

            // Ensure only 1 shape layer is selected;
            if (!(userLayers.length == 1)){
                alert("Select one shape layer!");
                return;
            } else {
                if (!(userLayers[0] instanceof ShapeLayer)){
                    alert("Only select shape layers!");
                    return;
                }
            }
            
            var thisLayer = userLayers[0];
            
            // Create an array, 'shapeGroupIndexArray' to hold indices of target shape groups
            // If we're using all shapes, then each array item will be an index, 0 to max
            // If we're using selected shapes, then specify the array.
            var shapeGroupIndexArray = new Array;
            var j = 0;
            for (var i = 0; i < thisLayer.property(2).numProperties; i++){
                    if (useAll == true){
                        shapeGroupIndexArray[i] = i;
                } else {
                    if (thisLayer.property(2).property(i+1).selected == true){
                        shapeGroupIndexArray[j] = i;
                        j++;
                    }
                } // end if
            } // end for

            // Create an array of shape groups, populated by the indices we've specified above. Either all, or selected.
            var shapeGroupArray = new Array;
            for (var i = 0; i < shapeGroupIndexArray.length; i++){
                shapeGroupArray[i] = thisLayer.property(2).property(shapeGroupIndexArray[i]+1);
            }

            // Make a new layer for each shape group, then isolate it on the layer.
            zl_ExplodeShapeLayers_doExplode(shapeGroupArray, centrePoints);
            
            // Are we deleting source layer? If so, do it.
            if (deleteSource == true)
                thisLayer.remove();
            else
                thisLayer.enabled = false;
            
        } else if (explode == false) { // Merge!
            
            // Ensure multiple shape layers selected.
            if (userLayers.length < 2){
                alert("Select at least two shape layers!")
                return;
            } else {
                for (var i = 0; i < userLayers.length; i++){
                    var thisLayer = userLayers[i];
                    
                    if (!(thisLayer instanceof ShapeLayer)){
                        alert("Only select shape layers!");
                        return;
                    } // end if
                } // end for
            } // end if

            zl_ExplodeShapeLayers_doMerge(userLayers, deleteSource);
            
        } // end if
    
    } // end function ExplodeShapeLayers

    /****************************** 
        zl_ExplodeShapeLayers_doExplode()
          
        Description:
        This function contains main logic for exploding a shape layer.
        Makes a new layer for each shape group, then isolates it on the layer.
         
        Parameters:
        thisLayer - current (source) layer
        vectorGroupCollection - collection of all shape groups (not effects)
        targetIndex - index of the shape to keep for this layer
        
        Returns:
        Nothing
     ******************************/
    function zl_ExplodeShapeLayers_doExplode(shapeGroupArray, centrePoints){
        var sourceLayer = shapeGroupArray[0].propertyGroup(2);
        
        for (var i = 0; i < shapeGroupArray.length; i++){
            sourceLayer.duplicate();
            var thisComp = app.project.activeItem;
            var newLayer = thisComp.layer(sourceLayer.index-1);            
            var targetShapeGroup = shapeGroupArray[i];

            // Rename the new layer                
            newLayer.name = sourceLayer.name + " - ";

            // Isolate the shape group within the layer
            zl_ExplodeShapeLayers_isolateGroup(newLayer, targetShapeGroup);

            // Are we centring? If so, do it.
            if (centrePoints == true)
                zl_ExplodeShapeLayers_centreAnchorPoint(thisComp, newLayer);
        }
    }

    /****************************** 
        zl_ExplodeShapeLayers_doMerge()
          
        Description:
        This function contains main logic for exploding a shape layer.
        Makes a new layer for each shape group, then isolates it on the layer.
         
        Parameters:
        thisLayer - current (source) layer
        vectorGroupCollection - collection of all shape groups (not effects)
        targetIndex - index of the shape to keep for this layer
        
        Returns:
        Nothing
     ******************************/
    function zl_ExplodeShapeLayers_doMerge(userLayers, deleteSource){
        var oldIndex = userLayers[0].index;
        var newIndex = oldIndex;
        //var fullString = "";
                
        for (var i = 0; i < userLayers.length; i++){
            var thisLayer = userLayers[i];
                    
            //Get a list of merged layers -- UNUSED
            //if (i == userLayers.length-1)
            //    fullString += thisLayer.index;
            //else
            //    fullString += thisLayer.index + ", ";

            // Find the lowest-index layer to move merged above
            if (thisLayer.index < oldIndex)
                newIndex = thisLayer.index;
                
        } // end for
       
        
        var thisComp = app.project.activeItem;
        var targetLayer = thisComp.layers.addShape();
        
        targetLayer.moveBefore(thisComp.layer(newIndex+1));
        // targetLayer.name = "Merged Shape Layer (" + fullString + ")"; // Unused-- would add in a list of merged layer indices to layer name
        targetLayer.name = "Merged Shape Layer";
        targetLayer.property("Transform").property("ADBE Position").setValue([0,0]);
        
        zl_ExplodeShapeLayers_layerSelect(targetLayer, false);
        zl_ExplodeShapeLayers_layerSelect(userLayers, true);
        
        zl_ExplodeShapeLayers_shapeCloner(userLayers, targetLayer, deleteSource);
        zl_ExplodeShapeLayers_centreAnchorPoint(thisComp, targetLayer);
        
    } // end for


    /****************************** 
        zl_ExplodeShapeLayers_isolateGroup()
          
        Description:
        This function isolates the target group from a shape layer
         
        Parameters:
        targetLayer - layer to strip down
        vectorGroupCollection - collection of all shape groups (not effects)
        targetIndex - index of the shape to keep for this layer
        
        Returns:
        Nothing
     ******************************/
    function zl_ExplodeShapeLayers_isolateGroup(targetLayer, targetShapeGroup){
        var newShapeGroup = targetLayer.property(2);

        // Find the targetShapeGroup within the current layer. When found, push to top of the stack.
        for (var i = 1; i <= targetLayer.property(2).numProperties; i++){
            if (targetLayer.property(2).property(i).propertyIndex == targetShapeGroup.propertyIndex){
                newShapeGroup.property(i).moveTo(1);
            }
        }

        // Run through the new shape group and remove all but the target
        for (var i = newShapeGroup.numProperties; i > 1; i--)
            newShapeGroup.property(i).remove();
            
        // Name the target layer based on the target shape group
        targetLayer.name += newShapeGroup.property(1).name;

    } // end function isolateGroup


    /****************************** 
        zl_ExplodeShapeLayers_layerSelect()
          
        Description:
        Selects or deselects all passed layers
         
        Parameters:
        target - layer(s) to select/deselect
        status - bool, true/false for whether should be selected
        
        Returns:
        Nothing
     ******************************/
    function zl_ExplodeShapeLayers_layerSelect(target, status){
        if (target.length == null){
            target.selected = status;
        } else {
            for (var i = 0; i < target.length; i++){
                target[i].selected = status;
            }
        }
    } // end function layerSelect


    /****************************** 
        zl_ExplodeShapeLayers_shapeCloner()
          
        Description:
        Clones selected shape layers into target layer
         
        Parameters:
        sourceLayers - layers to Explode
        destLayer - layer to clone into
		deleteSource - bool, whether to delete source layers (vs hide)
        
        Returns:
        Nothing
     ******************************/
    // Run through each layer, copy all the contents and bam
    function zl_ExplodeShapeLayers_shapeCloner(sourceLayers, destLayer, deleteSource){
    
        zl_ExplodeShapeLayers_layerSelect(sourceLayers, false);
    
        for (var m = 0; m < sourceLayers.length; m++){
        
            // Define the current layer and select it
            var thisLayer = sourceLayers[m];
            zl_ExplodeShapeLayers_layerSelect(thisLayer, true);
        
            // Select all of the properties in this layer
            for (var i = 1; i <= thisLayer.property("Contents").numProperties; i++){
                var curProp = thisLayer.property("Contents").property(i);
                curProp.selected = true;
            }
        
            app.executeCommand(19); // Copy
        
            // Change selection to target layer
            thisLayer.enabled = false;
            zl_ExplodeShapeLayers_layerSelect(thisLayer, false);
            destLayer.enabled = true;
            zl_ExplodeShapeLayers_layerSelect(destLayer, true);
            
            // Create a new vector group and name it with the source layer
            var newGroup = destLayer.property("Contents").addProperty("ADBE Vector Group");
            newGroup.name = thisLayer.name;
        
            var tempAnchor = [thisLayer.property("Transform").property("ADBE Anchor Point").value[0], thisLayer.property("Transform").property("ADBE Anchor Point").value[1]];
            newGroup.property("Transform").property("ADBE Vector Anchor").setValue(tempAnchor);
        
            var tempXform = [thisLayer.property("Transform").property("ADBE Position").value[0], thisLayer.property("Transform").property("ADBE Position").value[1]];
            newGroup.property("Transform").property("ADBE Vector Position").setValue(tempXform);
        
            var tempScale = [thisLayer.property("Transform").property("ADBE Scale").value[0], thisLayer.property("Transform").property("ADBE Scale").value[1]];
            newGroup.property("Transform").property("ADBE Vector Scale").setValue(tempScale);
        
            var tempRot = thisLayer.property("Transform").property("ADBE Rotate Z").value;
            newGroup.property("Transform").property("ADBE Vector Rotation").setValue(tempRot);
            
            var tempOpac = thisLayer.property("Transform").property("ADBE Opacity").value;
            newGroup.property("Transform").property("ADBE Vector Group Opacity").setValue(tempOpac);
            
            // Select that layer, paste the contents in, deselect everything
            zl_ExplodeShapeLayers_layerSelect(newGroup, true);
            app.executeCommand(20); // Paste
            zl_ExplodeShapeLayers_layerSelect(destLayer, false);
            
            if (deleteSource == true)
                thisLayer.remove();
            
        }
    } // end function shapeCloner


    /****************************** 
        zl_ExplodeShapeLayers_centreAnchorPoint()
          
        Description:
        Centres the anchor point of current layer
         
        Parameters:
        thisComp - active comp
        targetLayer - layer to center anchor of
        
        Returns:
        Nothing.
     ******************************/
    function zl_ExplodeShapeLayers_centreAnchorPoint(thisComp, targetLayer){
        var sourceRect = targetLayer.sourceRectAtTime(thisComp.time,false);
        var newAnch = [sourceRect.width/2, sourceRect.height/2];
        var oldAnch = targetLayer.anchorPoint.value;

        var xAdjust = newAnch[0] + sourceRect.left;
        var yAdjust = newAnch[1] + sourceRect.top;
    
        targetLayer.anchorPoint.setValue([xAdjust, yAdjust]);
        
        var xShift = (xAdjust - oldAnch[0]) * (targetLayer.scale.value[0]/100);
        var yShift = (yAdjust - oldAnch[1])  * (targetLayer.scale.value[1]/100);    

        var xPos = targetLayer.position.value[0];
        var yPos = targetLayer.position.value[1];

        targetLayer.position.setValue([xPos + xShift, yPos + yShift]);
    } // end function centreAnchorPoint
    
    
    /****************************** 
        zl_ExplodeShapeLayers_createPalette()
          
        Description:
        Creates ScriptUI Palette Panel
        Generated using Boethos (crgreen.com/boethos)
        
        Parameters:
        thisObj - this comp object
        
        Returns:
        Nothing
     ******************************/
    function zl_ExplodeShapeLayers_createPalette(thisObj) { 
        var win = (thisObj instanceof Panel) ? thisObj : new Window('palette', zl_ESL__scriptName, undefined); 
        var centrePoints = true;
        var deleteSource = false;
        var useAll = true;
        
        { // Buttons
            { // Explode
                win.buttonGroup = win.add('group', undefined, '', {borderStyle: "none"});
                win.buttonGroup.orientation = "row";
                
                win.buttonGroup.explodeButton = win.buttonGroup.add('button', undefined, 'Explode!'); 
                win.buttonGroup.explodeButton.onClick = function () {
                    if (app.project) {
                        var activeItem = app.project.activeItem;
                        
                        if (activeItem != null && (activeItem instanceof CompItem)) {
                            app.beginUndoGroup(zl_ESL__scriptName);
                            zl_ExplodeShapeLayers(true, useAll, deleteSource, centrePoints);
                            app.endUndoGroup();
                        } else {
                            alert("Select a shape layer!", zl_ESL__scriptName);
                        }
                    } else {
                        alert("Open a project!", zl_ESL__scriptName);
                    }
                }
            } // end explode
        
            { // Merge
                win.buttonGroup.mergeButton = win.buttonGroup.add('button', undefined, 'Merge!'); 
                win.buttonGroup.mergeButton.onClick = function () {
                    if (app.project) {
                        var activeItem = app.project.activeItem;
                        
                        if (activeItem != null && (activeItem instanceof CompItem)) {
                            app.beginUndoGroup(zl_ESL__scriptName);
                            zl_ExplodeShapeLayers(false, useAll, deleteSource, centrePoints);
                            app.endUndoGroup();
                        } else {
                            alert("Select at least two shape layers!", zl_ESL__scriptName);
                        }
                    } else {
                        alert("Open a project!", zl_ESL__scriptName);
                    }
                }
            } // end merge
        
        }
    
        { // Options
            win.optionGroup = win.add('panel', undefined, 'Options', {borderStyle: "etched"}); 
            win.optionGroup.alignChildren = "left";
            win.optionGroup.spacing = 0;

            win.optionGroup.useAllOption = win.optionGroup.add('checkbox', undefined, 'Use All Shapes'); 
            win.optionGroup.useAllOption.value = true; 
            win.optionGroup.useAllOption.onClick = function(){
                useAll = this.value;
            }
        
            win.optionGroup.deleteOption = win.optionGroup.add('checkbox', undefined, 'Delete Source Layer(s)'); 
            win.optionGroup.deleteOption.value = false; 
            win.optionGroup.deleteOption.onClick = function(){
                deleteSource = this.value;
            }
        
            win.optionGroup.centreOption = win.optionGroup.add('checkbox', undefined, 'Centre Anchor Points'); 
            win.optionGroup.centreOption.value = true; 
            win.optionGroup.centreOption.onClick = function(){
                centrePoints = this.value;
            }
        
            win.optionGroup.centreDisclaimer = win.optionGroup.add('statictext', undefined, '\u00A0\u00A0\u00A0\u00A0\u00A0(Explode Only)');
            //win.optionGroup.centreDisclaimer = win.optionGroup.add('statictext', undefined, '(Explode Only)');
            win.optionGroup.centreDisclaimer.alignment = "left";
        }

        if (win instanceof Window) {
            win.show();
        } else {
            win.layout.layout(true);
        }
    } // end function createPalette


    /****************************** 
        zl_ExplodeShapeLayers_main()
          
        Description:
        Main function
            
        Parameters:
        thisObj - this comp object
        
        Returns:
        Nothing
     ******************************/
    function zl_ExplodeShapeLayers_main(thisObj) {
        zl_ExplodeShapeLayers_createPalette(thisObj);
    } // end function main

    // RUN!
    zl_ExplodeShapeLayers_main(this);