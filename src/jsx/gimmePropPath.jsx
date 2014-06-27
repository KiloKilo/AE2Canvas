{
    // rd_GimmePropPath.jsx
    // Copyright (c) 2006-2007 redefinery (Jeffrey R. Almasol). All rights reserved.
    // check it: www.redefinery.com
    //
    // Name: rd_GimmePropPath
    // Version: 2.0
    //
    // Description:
    // This script displays the scripting and expression code needed to access
    // the selected property or property group. Use this information to
    // access the selection correctly in your code.
    //
    // Select only a single property or property group; selection of some
    // properties also select the parent property group, which is fine.
    // Selection of multiple properties or property groups at the same
    // property depth are not allowed. However, for multiple properties or
    // property groups of different depths, the deepest property or property
    // group will be used.
    //
    // You can control the root object used in the generated code, how
    // properties and property groups are referenced (and if index numbers
    // should be used, when available), and how the composition or layer is
    // referenced in the expression code.
    //
    // The generated scripting and expression code can be copied for use
    // in your scripts or expressions. You can also test the generated
    // script code to make sure it will access the correct property or
    // property group.
    //
    // Note: If the Root Object = Layer and Expression References = Relative,
    // the displayed expression code will work only if it is used on the
    // same layer.
    //
    // Note: For properties such as Custom Value types that cannot
    // be targeted via expressions, a "NOT FUNCTIONAL" label will appear
    // above the Via Expression area.
    //
    // Note: This version of the script requires After Effects CS3
    // or later. It can be used as a dockable panel by placing the
    // script in a ScriptUI Panels subfolder of the Scripts folder,
    // and then choosing this script from the Window menu.
    //
    // Thanks to Dan Ebberts for the idea for this script and help in
    // reviewing it.
    //
    // Legal stuff:
    // This script is provided "as is," without warranty of any kind, expressed
    // or implied. In no event shall the author be held liable for any damages
    // arising in any way from the use of this script.
    //
    // In other words, I'm just trying to share knowledge with and help out my
    // fellow AE script heads, so don't blame me if my code doesn't rate. :-)


    // rd_GimmePropPath()
    //
    // Description:
    // This function contains the main logic for this script.
    //
    // Parameters:
    // thisObj - "this" object.
    //
    // Returns:
    // Nothing.
    //
    function rd_GimmePropPath(thisObj) {
        // Globals

        var rd_GimmePropPathData = new Object();	// Store globals in an object
        rd_GimmePropPathData.scriptName = "rd: Gimme Prop Path";
        rd_GimmePropPathData.scriptTitle = rd_GimmePropPathData.scriptName + " v2.0";

        rd_GimmePropPathData.lastQueriedProp = null;

        rd_GimmePropPathData.strRootObj = {en: "Root Object:"};
        rd_GimmePropPathData.strRootObjApp = {en: "Application"};
        rd_GimmePropPathData.strRootObjComp = {en: "Composition"};
        rd_GimmePropPathData.strRootObjLayer = {en: "Layer"};
        rd_GimmePropPathData.strRefMode = {en: "Expression References:"};
        rd_GimmePropPathData.strRefModeAbs = {en: "Absolute"};
        rd_GimmePropPathData.strRefModeRel = {en: "Relative"};
        rd_GimmePropPathData.strPropNameRefs = {en: "Properties Referenced By:"};
        rd_GimmePropPathData.strPropNameRefsByMatchName = {en: "Match Name"};
        rd_GimmePropPathData.strPropNameRefsByName = {en: "Name"};
        rd_GimmePropPathData.strPropNameRefsByIndex = {en: "Use index number for group properties"};
        rd_GimmePropPathData.strPropNameCompactEnglish = {en: "Use compact English syntax"};
        rd_GimmePropPathData.strScriptRefs = {en: "Scripting References:"};
        rd_GimmePropPathData.strScriptRefCollapse = {en: "Collapse \".property()\" syntax"};
        rd_GimmePropPathData.strViaScripting = {en: "Via Scripting:"};
        rd_GimmePropPathData.strViaExpression = {en: "Via Expression:"};
        rd_GimmePropPathData.strGetPropPath = {en: "Get Property Path"};
        rd_GimmePropPathData.strTest = {en: "Test"};
        rd_GimmePropPathData.strHelp = {en: "?"};
        rd_GimmePropPathData.strErrNoCompSel = {en: "Cannot perform operation. Please select or open a single composition in the Project window, and try again."};
        rd_GimmePropPathData.strErrNoSinglePropSel = {en: "Cannot perform operation. Please select only one property or property group, and try again."};
        rd_GimmePropPathData.strErrTextScriptCode = {en: "Cannot test script code. Be sure the selected or active composition contains the selected property in the displayed code, and try again."};
        rd_GimmePropPathData.strMinAE80 = {en: "This script requires Adobe After Effects CS3 or later."};
        rd_GimmePropPathData.strErrExprNotFunc = {en: "NOT FUNCTIONAL"};
        rd_GimmePropPathData.strHelpText =
        {
            en: "Copyright (c) 2006-2007 redefinery (Jeffrey R. Almasol). \n" +
                "All rights reserved.\n" +
                "\n" +
                "This script displays the scripting and expression code needed to access the selected property or property group. Use this information to access the selection correctly in your code.\n" +
                "\n" +
                "Select only a single property or property group; selection of some properties also select the parent property group, which is fine. Selection of multiple properties or property groups at the same property depth are not allowed. However, for multiple properties or property groups of different depths, the deepest property or property group will be used.\n" +
                "\n" +
                "You can control the root object used in the generated code, how properties and property groups are referenced (and if index numbers should be used, when available), and how the composition or layer is referenced in the expression code.\n" +
                "\n" +
                "The generated scripting and expression code can be copied for use in your scripts or expressions. You can also test the generated script code to make sure it will access the correct property or property group.\n" +
                "\n" +
                "Note: If the Root Object = Layer and Expression References = Relative, the displayed expression code will work only if it is used on the same layer.\n" +
                "\n" +
                "Note: For properties such as Custom Value types that cannot be targeted via expressions, a \"NOT FUNCTIONAL\" label will appear above the Via Expression area.\n" +
                "\n" +
                "Note: This version of the script requires After Effects CS3 or later. It can be used as a dockable panel by placing the script in a ScriptUI Panels subfolder of the Scripts folder, and then choosing this script from the Window menu.\n" +
                "\n" +
                "Thanks to Dan Ebberts for the idea for this script and help in reviewing it."
        };

        // Associative array that converts property match names to their compact English expression statements.
        // For simple conversions, quote the result!
        //
        var propCompactEnglishExprs =
        {
            "ADBE Transform Group": "'transform'",
            // Handle camera/light vs. AV layers
            "ADBE Anchor Point": "((prop.propertyGroup(prop.propertyDepth).property('intensity')!=null) || (prop.propertyGroup(prop.propertyDepth).property('zoom')!=null)) ? '.pointOfInterest' : '.anchorPoint'",
            "ADBE Position": "'.position'",
            "ADBE Scale": "'.scale'",
            "ADBE Orientation": "'.orientation'",
            "ADBE Rotate X": "'.xRotation'",
            "ADBE Rotate Y": "'.yRotation'",
            // Handle 3D vs. 2D layers
            "ADBE Rotate Z": "(prop.propertyGroup(prop.propertyDepth).threeDLayer || (prop.propertyGroup(prop.propertyDepth).property('intensity')!=null) || (prop.propertyGroup(prop.propertyDepth).property('zoom')!=null)) ? '.zRotation' : '.rotation'",
            "ADBE Opacity": "'.opacity'",

            "ADBE Material Options Group": "'materialOption'",
            "ADBE Casts Shadows": "'.castsShadows'",
            "ADBE Light Transmission": "'.lightTransmission'",
            "ADBE Accepts Shadows": "'.acceptsShadows'",
            "ADBE Accepts Lights": "'.acceptsLights'",
            "ADBE Ambient Coefficient": "'.ambient'",
            "ADBE Diffuse Coefficient": "'.diffuse'",
            "ADBE Specular Coefficient": "'.specular'",
            "ADBE Shininess Coefficient": "'.shininess'",
            "ADBE Metal Coefficient": "'.metal'",

            "ADBE Light Options Group": "'lightOption'",
            "ADBE Light Intensity": "'.intensity'",
            "ADBE Light Color": "'.color'",
            "ADBE Light Cone Angle": "'.coneAngle'",
            "ADBE Light Cone Feather 2": "'.coneFeather'",
            //"ADBE Casts Shadows":										"'.castsShadows'",	// Already covered previously
            "ADBE Light Shadow Darkness": "'.shadowDarkness'",
            "ADBE Light Shadow Diffusion": "'.shadowDiffusion'",

            "ADBE Camera Options Group": "'cameraOption'",
            "ADBE Camera Zoom": "'.zoom'",
            "ADBE Camera Depth of Field": "'.depthOfField'",
            "ADBE Camera Focus Distance": "'.focusDistance'",
            "ADBE Camera Aperture": "'.aperture'",
            "ADBE Camera Blur Level": "'.blurLevel'",

            "ADBE Text Properties": "'text'",
            "ADBE Text Document": "'.sourceText'",
            "ADBE Text Path Options": "'.pathOption'",
            "ADBE Text Path": "'.path'",
            "ADBE Text Reverse Path": "'.reversePath'",
            "ADBE Text Perpendicular To Path": "'.perpendicularToPath'",
            "ADBE Text Force Align Path": "'.forceAlignment'",
            "ADBE Text First Margin": "'.firstMargin'",
            "ADBE Text Last Margin": "'.lastMargin'",
            "ADBE Text More Options": "'.moreOption'",
            "ADBE Text Anchor Point Option": "'.anchorPointGrouping'",
            "ADBE Text Anchor Point Align": "'.groupingAlignment'",
            "ADBE Text Render Order": "'.fillANdStroke'",
            "ADBE Text Character Blend Mode": "'.interCharacterBlending'",

            "ADBE Text Animators": "'.animator'",
            //"ADBE Text Animator":										"''",		// No equivalent
            "ADBE Text Selectors": "'.selector'",
            //"ADBE Text Selector":											"''",		// No equivalent
            "ADBE Text Percent Start": "'.start'",
            "ADBE Text Percent End": "'.end'",
            "ADBE Text Percent Offset": "'.offset'",
            "ADBE Text Index Start": "'.start'",
            "ADBE Text Index End": "'.end'",
            "ADBE Text Index Offset": "'.offset'",
            "ADBE Text Range Advanced": "'.advanced'",
            "ADBE Text Range Units": "'.units'",
            "ADBE Text Range Type2": "'.basedOn'",
            "ADBE Text Selector Mode": "'.mode'",
            "ADBE Text Selector Max Amount": "'.amount'",
            "ADBE Text Range Shape": "'.shape'",
            "ADBE Text Selector Smoothness": "'.smoothness'",
            "ADBE Text Levels Max Ease": "'.easeHigh'",
            "ADBE Text Levels Min Ease": "'.easeLow'",
            "ADBE Text Randomize Order": "'.randomizeOrder'",
            "ADBE Text Random Seed": "'.randomSeed'",
            //"ADBE Text Wiggly Selector":								"''",		// No equivalent
            "ADBE Text Selector Mode": "'.mode'",
            "ADBE Text Wiggly Max Amount": "'.maxAmount'",
            "ADBE Text Wiggly Min Amount": "'.minAmount'",
            "ADBE Text Range Type2": "'.basedOn'",
            "ADBE Text Temporal Freq": "'.wigglesSecond'",
            "ADBE Text Character Correlation": "'.correlation'",
            "ADBE Text Temporal Phase": "'.temporalPhase'",
            "ADBE Text Spatial Phase": "'.spatialPhase'",
            "ADBE Text Wiggly Lock Dim": "'.lockDimensions'",
            "ADBE Text Wiggly Random Seed": "'.randomSeed'",
            //"ADBE Text Expressible Selector":						"''",		// No equivalent
            "ADBE Text Range Type2": "'.basedOn'",
            "ADBE Text Expressible Amount": "'.amount'",
            "ADBE Text Animator Properties": "'.property'",
            "ADBE Text Anchor Point 3D": "'.anchorPoint'",
            "ADBE Text Position 3D": "'.position'",
            "ADBE Text Scale 3D": "'.scale'",
            "ADBE Text Skew": "'.skew'",
            "ADBE Text Skew Axis": "'.skewAxis'",
            "ADBE Text Rotation X": "'.xRotation'",
            "ADBE Text Rotation Y": "'.yRotation'",
            "ADBE Text Rotation": "'.zRotation'",
            "ADBE Text Opacity": "'.opacity'",
            "ADBE Text Fill Opacity": "'.fillOpacity'",
            "ADBE Text Fill Color": "'.fillColor'",
            "ADBE Text Fill Hue": "'.fillHue'",
            "ADBE Text Fill Saturation": "'.fillSaturation'",
            "ADBE Text Fill Brightness": "'.fillBrightness'",
            "ADBE Text Stroke Opacity": "'.strokeOpacity'",
            "ADBE Text Stroke Color": "'.strokeColor'",
            "ADBE Text Stroke Hue": "'.strokeHue'",
            "ADBE Text Stroke Saturation": "'.strokeSaturation'",
            "ADBE Text Stroke Brightness": "'.strokeBrightness'",
            "ADBE Text Stroke Width": "'.strokeWidth'",
            "ADBE Text Line Anchor": "'.lineAnchor'",
            "ADBE Text Line Spacing": "'.lineSpacing'",
            "ADBE Text Track Type": "'.trackingType'",
            "ADBE Text Tracking Amount": "'.trackingAmount'",
            "ADBE Text Character Change Type": "'.characterAlignment'",
            "ADBE Text Character Range": "'.characterRange'",
            "ADBE Text Character Replace": "'.characterValue'",
            "ADBE Text Character Offset": "'.characterOffset'",
            "ADBE Text Blur": "'.blur'",

            "ADBE Mask Parade": "'mask'",
            "ADBE Mask Shape": "'.maskPath'",
            "ADBE Mask Feather": "'.maskFeather'",
            "ADBE Mask Opacity": "'.maskOpacity'",
            "ADBE Mask Offset": "'.maskExpansion'",

            "ADBE Effect Parade": "'effect'",

            //"ADBE Paint":													"''",
            //"ADBE Paint On Transparent":								"''",
            "ADBE Paint Group": "'.stroke'",
            //"ADBE Paint Atom":											"''",
            //"ADBE Paint Transfer Mode":								"''",
            //"ADBE Paint Duration":										"''",
            "ADBE Paint Shape": "'.path'",
            "ADBE Paint Properties": "'.strokeOption'",
            "ADBE Paint Begin": "'.start'",
            "ADBE Paint End": "'.end'",
            "ADBE Paint Color": "'.color'",
            "ADBE Paint Diameter": "'.diameter'",
            "ADBE Paint Angle": "'.angle'",
            "ADBE Paint Hardness": "'.hardness'",
            "ADBE Paint Roundness": "'.roundness'",
            "ADBE Paint Tip Spacing": "'.spacing'",
            "ADBE Paint Target Channels": "'.channels'",
            "ADBE Paint Opacity": "'.opacity'",
            "ADBE Paint Flow": "'.flow'",
            "ADBE Paint Clone Layer": "'.cloneSource'",
            "ADBE Paint Clone Position": "'.clonePosition'",
            "ADBE Paint Clone Time": "'.cloneTime'",
            "ADBE Paint Clone Time Shift": "'.cloneTimeShift'",
            //"ADBE Paint Clone Source Type":							"''",
            "ADBE Paint Transform": "'.transform'",
            "ADBE Paint Anchor Point": "'.anchorPoint'",
            "ADBE Paint Position": "'.position'",
            "ADBE Paint Scale": "'.scale'",
            "ADBE Paint Rotation": "'.rotation'",
            //"ADBE Paint Nibbler Group":								"''",

            "ADBE MTrackers": "'motionTracker'",
            "ADBE MTracker Pt Feature Center": "'.featureCenter'",
            "ADBE MTracker Pt Feature Size": "'.featureSize'",
            "ADBE MTracker Pt Search Ofst": "'.searchOffset'",
            "ADBE MTracker Pt Search Size": "'.searchSize'",
            "ADBE MTracker Pt Confidence": "'.confidence'",
            "ADBE MTracker Pt Attach Pt": "'.attachPoint'",
            "ADBE MTracker Pt Attach Pt Ofst": "'.attachPointOffset'",

            "ADBE Audio Group": "'audio'",
            "ADBE Audio Levels": "'.audioLevels'",

            "ADBE Time Remapping": "'timeRemap'",

            "ADBE Layer Styles": "'layerStyle'",
            "ADBE Blend Options Group": "'.blendingOption'",
            "ADBE Global Angle2": "'.globalLightAngle'",
            "ADBE Global Altitude2": "'.globalLightAltitude'",
            "ADBE Adv Blend Group": "'.advancedBlending'",
            "ADBE Layer Fill Opacity2": "'.fillOpacity'",
            "ADBE R Channel Blend": "'.red'",
            "ADBE G Channel Blend": "'.green'",
            "ADBE B Channel Blend": "'.blue'",
            "ADBE Blend Interior": "'.blendInteriorStylesAsGroup'",
            "ADBE Blend Ranges": "'.useBlendRangesFromSource'",
            "dropShadow/enabled": "'.dropShadow'",
            "dropShadow/mode2": "'.blendMode'",
            "dropShadow/color": "'.color'",
            "dropShadow/opacity": "'.opacity'",
            "dropShadow/useGlobalAngle": "'.useGlobalLight'",
            "dropShadow/localLightingAngle": "'.angle'",
            "dropShadow/distance": "'.distance'",
            "dropShadow/chokeMatte": "'.spread'",
            "dropShadow/blur": "'.size'",
            "dropShadow/noise": "'.noise'",
            "dropShadow/layerConceals": "'.layerKnocksOutDropShadow'",
            "innerShadow/enabled": "'.innerShadow'",
            "innerShadow/mode2": "'.blendMode'",
            "innerShadow/color": "'.color'",
            "innerShadow/opacity": "'.opacity'",
            "innerShadow/useGlobalAngle": "'.useGlobalLight'",
            "innerShadow/localLightingAngle": "'.angle'",
            "innerShadow/distance": "'.distance'",
            "innerShadow/chokeMatte": "'.choke'",
            "innerShadow/blur": "'.size'",
            "innerShadow/noise": "'.noise'",
            "outerGlow/enabled": "'.outerGlow'",
            "outerGlow/mode2": "'.blendMode'",
            "outerGlow/opacity": "'.opacity'",
            "outerGlow/noise": "'.noise'",
            "outerGlow/AEColorChoice": "'.colorType'",
            "outerGlow/color": "'.color'",
            //"outerGlow/gradient":											"'.'",		// No equivalent
            "outerGlow/gradientSmoothness": "'.gradientSmoothness'",
            "outerGlow/glowTechnique": "'.technique'",
            "outerGlow/chokeMatte": "'.spread'",
            "outerGlow/blur": "'.size'",
            "outerGlow/inputRange": "'.range'",
            "outerGlow/shadingNoise": "'.jitter'",
            "innerGlow/enabled": "'.innerGlow'",
            "innerGlow/mode2": "'.blendMode'",
            "innerGlow/opacity": "'.opacity'",
            "innerGlow/noise": "'.noise'",
            "innerGlow/AEColorChoice": "'.colorType'",
            "innerGlow/color": "'.color'",
            //"innerGlow/gradient":											"'.'",		// No equivalent
            "innerGlow/gradientSmoothness": "'.gradientSmoothness'",
            "innerGlow/glowTechnique": "'.technique'",
            "innerGlow/innerGlowSource": "'.source'",
            "innerGlow/chokeMatte": "'.choke'",
            "innerGlow/blur": "'.size'",
            "innerGlow/inputRange": "'.range'",
            "innerGlow/shadingNoise": "'.jitter'",
            "bevelEmboss/enabled": "'.bevelAndEmboss'",
            "bevelEmboss/bevelStyle": "'.style'",
            "bevelEmboss/bevelTechnique": "'.technique'",
            "bevelEmboss/strengthRatio": "'.depth'",
            "bevelEmboss/bevelDirection": "'.direction'",
            "bevelEmboss/blur": "'.size'",
            "bevelEmboss/softness": "'.soften'",
            "bevelEmboss/useGlobalAngle": "'.useGlobalLight'",
            "bevelEmboss/localLightingAngle": "'.angle'",
            "bevelEmboss/localLightingAltitude": "'.altitude'",
            "bevelEmboss/highlightMode": "'.highlightMode'",
            "bevelEmboss/highlightColor": "'.highlightColor'",
            "bevelEmboss/highlightOpacity": "'.highlightOpacity'",
            "bevelEmboss/shadowMode": "'.shadowMode'",
            "bevelEmboss/shadowColor": "'.shadowColor'",
            "bevelEmboss/shadowOpacity": "'.shadowOpacity'",
            "chromeFX/enabled": "'.satin'",
            "chromeFX/mode2": "'.blendMode'",
            "chromeFX/color": "'.color'",
            "chromeFX/opacity": "'.opacity'",
            "chromeFX/localLightingAngle": "'.angle'",
            "chromeFX/distance": "'.distance'",
            "chromeFX/blur": "'.size'",
            "chromeFX/invert": "'.invert'",
            "solidFill/enabled": "'.colorOverlay'",
            "solidFill/mode2": "'.blendMode'",
            "solidFill/color": "'.color'",
            "solidFill/opacity": "'.opacity'",
            "gradientFill/enabled": "'.gradientOverlay'",
            "gradientFill/mode2": "'.blendMode'",
            "gradientFill/opacity": "'.opacity'",
            //"gradientFill/gradient":										"'.'",		// No equivalent
            "gradientFill/gradientSmoothness": "'.gradientSmoothness'",
            "gradientFill/angle": "'.angle'",
            "gradientFill/type": "'.style'",
            "gradientFill/reverse": "'.reverse'",
            "gradientFill/align": "'.alignWithLayer'",
            "gradientFill/scale": "'.scale'",
            "gradientFill/offset": "'.offset'",
            "patternFill/enabled": "'.patternOverlay'",
            "patternFill/mode2": "'.blendMode'",
            "patternFill/opacity": "'.opacity'",
            "patternFill/align": "'.linkWithLayer'",
            "patternFill/scale": "'.scale'",
            "patternFill/phase": "'.offset'",
            "frameFX/enabled": "'.stroke'",
            "frameFX/mode2": "'.blendMode'",
            "frameFX/color": "'.color'",
            "frameFX/size": "'.size'",
            "frameFX/opacity": "'.opacity'",
            "frameFX/style": "'.position'",
        };

        // Array that converts property match names to their compact English scripting statements.
        //
        var propCompactEnglishScriptingExprs =
        {
            "ADBE Text Animator Properties": "",
        };


        // rd_GimmePropPath_localize()
        //
        // Description:
        // This function localizes the given string variable based on the current locale.
        //
        // Parameters:
        //   strVar - The string variable's name.
        //
        // Returns:
        // String.
        //
        function rd_GimmePropPath_localize(strVar) {
            return strVar["en"];
        }


        // rd_GimmePropPath_buildUI()
        //
        // Description:
        // This function builds the user interface.
        //
        // Parameters:
        // thisObj - Panel object (if script is launched from Window menu); null otherwise.
        //
        // Returns:
        // Window or Panel object representing the built user interface.
        //
        function rd_GimmePropPath_buildUI(thisObj) {
            var pal = (thisObj instanceof Panel) ? thisObj : new Window("palette", rd_GimmePropPathData.scriptName, undefined, {resizeable: true});

            if (pal != null) {
                var res =
                    "group { \
                        orientation:'column', alignment:['fill','fill'], \
                        header: Group { \
                            alignment:['fill','top'], \
                            title: StaticText { text:'" + rd_GimmePropPathData.scriptName + "', alignment:['fill','center'] }, \
						help: Button { text:'" + rd_GimmePropPath_localize(rd_GimmePropPathData.strHelp) + "', maximumSize:[30,20], alignment:['right','center'] }, \
					}, \
					rootObj: Group { \
						alignment:['fill','top'], alignChildren:['left','center'], \
						lbl: StaticText { text:'" + rd_GimmePropPath_localize(rd_GimmePropPathData.strRootObj) + "' }, \
						rootObjApp: RadioButton { text:'" + rd_GimmePropPath_localize(rd_GimmePropPathData.strRootObjApp) + "', value:true }, \
						rootObjComp: RadioButton { text:'" + rd_GimmePropPath_localize(rd_GimmePropPathData.strRootObjComp) + "' }, \
						rootObjLayer: RadioButton { text:'" + rd_GimmePropPath_localize(rd_GimmePropPathData.strRootObjLayer) + "' }, \
					}, \
					propNameRefs: Group { \
						alignment:['fill','top'], alignChildren:['left','center'], \
						lbl: StaticText { text:'" + rd_GimmePropPath_localize(rd_GimmePropPathData.strPropNameRefs) + "' }, \
						propNameRefsByMatchName: RadioButton { text:'" + rd_GimmePropPath_localize(rd_GimmePropPathData.strPropNameRefsByMatchName) + "' }, \
						propNameRefsByName: RadioButton { text:'" + rd_GimmePropPath_localize(rd_GimmePropPathData.strPropNameRefsByName) + "', value:true }, \
					}, \
					propNameOpts: Group { \
						orientation:'column', alignment:['left','top'], alignChildren:['left','top'], spacing:5, \
						propNameRefsByIndex: Checkbox { text:'" + rd_GimmePropPath_localize(rd_GimmePropPathData.strPropNameRefsByIndex) + "' }, \
						propNameCompactEnglish: Checkbox { text:'" + rd_GimmePropPath_localize(rd_GimmePropPathData.strPropNameCompactEnglish) + "' }, \
					}, \
					scriptRefMode: Group { \
						alignment:['fill','top'], alignChildren:['left','center'], \
						lbl: StaticText { text:'" + rd_GimmePropPath_localize(rd_GimmePropPathData.strScriptRefs) + "' }, \
						scriptRefCollapse: Checkbox { text:'" + rd_GimmePropPath_localize(rd_GimmePropPathData.strScriptRefCollapse) + "' }, \
					}, \
					refMode : Group { \
						alignment:['fill','top'], alignChildren:['left','bottom'], \
						lbl: StaticText { text:'" + rd_GimmePropPath_localize(rd_GimmePropPathData.strRefMode) + "' }, \
						refModeAbs: RadioButton { text:'" + rd_GimmePropPath_localize(rd_GimmePropPathData.strRefModeAbs) + "', value:true }, \
						refModeRel: RadioButton { text:'" + rd_GimmePropPath_localize(rd_GimmePropPathData.strRefModeRel) + "' }, \
					}, \
					viaScript : Group { \
						orientation:'column', alignment:['fill','fill'], spacing:5, \
						heading: Group { \
							alignment:['fill','top'], \
							lbl: StaticText { text:'" + rd_GimmePropPath_localize(rd_GimmePropPathData.strViaScripting) + "', alignment:['left','bottom'] }, \
							viaScriptCodeTest: Button { text:'" + rd_GimmePropPath_localize(rd_GimmePropPathData.strTest) + "', enabled:false, alignment:['right','bottom'] }, \
						}, \
						viaScriptCode: EditText { text:'', properties:{'multiline':true, 'readonly':true}, alignment:['fill','fill'], minimumSize:[100,20] }, \
					}, \
					viaExpr : Group { \
						orientation:'column', alignment:['fill','fill'], spacing:5, \
						heading: Group { \
							alignment:['fill','top'], \
							lbl: StaticText { text:'" + rd_GimmePropPath_localize(rd_GimmePropPathData.strViaExpression) + "', alignment:['fill','bottom'] }, \
							viaExprMsg: StaticText { text:'', alignment:['right','bottom'], characters:15 }, \
						}, \
						viaExprCode: EditText { text:'', properties:{'multiline':true, 'readonly':true}, alignment:['fill','fill'], minimumSize:[100,20] }, \
					}, \
					cmds: Group { \
						alignment:['fill','bottom'], \
						getPropPathBtn: Button { text:'" + rd_GimmePropPath_localize(rd_GimmePropPathData.strGetPropPath) + "', alignment:['right','top'] }, \
					}, \
				} \
				";
                pal.grp = pal.add(res);

                // Workaround to ensure the edittext text color is black, even at darker UI brightness levels
                var winGfx = pal.graphics;
                var darkColorBrush = winGfx.newPen(winGfx.BrushType.SOLID_COLOR, [0, 0, 0], 1);
//				pal.grp.opts.affect.lst.graphics.foregroundColor = darkColorBrush;

                pal.grp.rootObj.lbl.preferredSize =
                    pal.grp.scriptRefMode.lbl.preferredSize =
                        pal.grp.refMode.lbl.preferredSize = pal.grp.propNameRefs.lbl.preferredSize;
                pal.grp.rootObj.rootObjApp.preferredSize =
                    pal.grp.refMode.refModeAbs.preferredSize = pal.grp.propNameRefs.propNameRefsByMatchName.preferredSize;
                pal.grp.propNameRefs.margins.top =
                    pal.grp.scriptRefMode.margins.top = 5;
                pal.grp.propNameOpts.indent = pal.grp.rootObj.lbl.preferredSize.width + pal.grp.rootObj.spacing;

                pal.layout.layout(true);
                pal.grp.minimumSize = pal.grp.size;
                pal.layout.resize();
                pal.onResizing = pal.onResize = function () {
                    this.layout.resize();
                }

                pal.grp.rootObj.rootObjApp.onClick = function () {
                    rd_GimmePropPath_buildPropPath(this.parent.parent.parent);
                }
                pal.grp.rootObj.rootObjComp.onClick = function () {
                    rd_GimmePropPath_buildPropPath(this.parent.parent.parent);
                }
                pal.grp.rootObj.rootObjLayer.onClick = function () {
                    rd_GimmePropPath_buildPropPath(this.parent.parent.parent);
                }
                pal.grp.propNameRefs.propNameRefsByMatchName.onClick = function () {
                    rd_GimmePropPath_buildPropPath(this.parent.parent.parent);
                }
                pal.grp.propNameRefs.propNameRefsByName.onClick = function () {
                    rd_GimmePropPath_buildPropPath(this.parent.parent.parent);
                }
                pal.grp.propNameOpts.propNameRefsByIndex.onClick = function () {
                    rd_GimmePropPath_buildPropPath(this.parent.parent.parent);
                }
                pal.grp.propNameOpts.propNameCompactEnglish.onClick = function () {
                    rd_GimmePropPath_buildPropPath(this.parent.parent.parent);
                }
                pal.grp.scriptRefMode.scriptRefCollapse.onClick = function () {
                    rd_GimmePropPath_buildPropPath(this.parent.parent.parent);
                }
                pal.grp.refMode.refModeAbs.onClick = function () {
                    rd_GimmePropPath_buildPropPath(this.parent.parent.parent);
                }
                pal.grp.refMode.refModeRel.onClick = function () {
                    rd_GimmePropPath_buildPropPath(this.parent.parent.parent);
                }
                pal.grp.viaScript.heading.viaScriptCodeTest.onClick = function () {
                    if (this.parent.parent.viaScriptCode.text != "") {
                        var code = this.parent.parent.viaScriptCode.text;

                        // Check if code is using composition or layer as the root object, and adjust accordingly so that the test will work
                        if (code[0] == "i")			// Comp-relative (starts with "item")
                            code = "app.project." + code;
                        else if (code[0] == "l")	// Layer-relative (starts with "layer")
                        {
                            var compItemNum = rd_GimmePropPath_findCompItemNum(app.project.activeItem);
                            if (compItemNum == 0) {
                                alert(rd_GimmePropPath_localize(rd_GimmePropPathData.strErrTextScriptCode), rd_GimmePropPathData.scriptName);
                                return;
                            }

                            code = "app.project.item(" + compItemNum + ")." + code;
                        }

                        // Evaluate the script code
                        code = "var prop = " + code + "; if ((prop.propertyType == PropertyType.PROPERTY) && (prop.propertyValueType != PropertyValueType.CUSTOM_VALUE)) alert(prop.name+\" = \"+prop.value.toString()); else alert(prop.name);";
                        try {
                            eval(code);
                        }
                        catch (e) {
                            alert(e.toString() + "\n\n" + rd_GimmePropPath_localize(rd_GimmePropPathData.strErrTextScriptCode), rd_GimmePropPathData.scriptName);
                        }
                    }
                }

                pal.grp.header.help.onClick = function () {
                    alert(rd_GimmePropPathData.scriptTitle + "\n" + rd_GimmePropPath_localize(rd_GimmePropPathData.strHelpText), rd_GimmePropPathData.scriptName);
                }
                pal.grp.cmds.getPropPathBtn.onClick = rd_GimmePropPath_doGetPropPath;
            }

            return pal;
        }


        // rd_GimmePropPath_findCompItemNum()
        //
        // Description:
        // This function determines the item number for the specified composiiton
        // in the Project window. This number is used for accessing the composition
        // via scripting.
        //
        // Parameters:
        //   comp - Composition object.
        //
        // Returns:
        // Number representing the item number for the composition; or 0 if
        // the composition item number cannot be identified.
        //
        function rd_GimmePropPath_findCompItemNum(comp) {
            var itemNum = 0, item;

            for (var i = 1; i <= app.project.numItems; i++) {
                item = app.project.item(i);
                if ((item instanceof CompItem) && (item == comp)) {
                    itemNum = i;
                    break;
                }
            }

            return itemNum;
        }


        // rd_GimmePropPath_buildPropPath()
        //
        // Description:
        // This function assembles the scripting and expression code for accessing
        // the current (or last queried) property, updating the appropriate UI
        // fields.
        //
        // Parameters:
        //   pal - Window or Panel object, representing the palette.
        //
        // Returns:
        // Nothing.
        //
        function rd_GimmePropPath_buildPropPath(pal) {
            // rd_GimmePropPath_getPropCompactEnglishExpr()
            //
            // Description:
            // This function looks up the specified property's compact English
            // expression statement in the propCompactEnglishExprs associative
            // array, if available.
            //
            // Parameters:
            //   prop - Property or PropertyGroup object.
            //   matchName - String representing the property's match name to
            //       use for lookup; in AE 6.5, this is overridden with the
            //       property's name.
            //   name - String representing the existing translation of the
            //       property name.
            //
            // Returns:
            // String representing the compact English equivalent, if available.
            //
            function rd_GimmePropPath_getPropCompactEnglishExpr(prop, matchName, name) {
                var translatedName = propCompactEnglishExprs[matchName];

                if (translatedName != undefined)
                    return eval(translatedName);
                else
                    return ("(" + name + ")");
            }


            // rd_GimmePropPath_getPropCompactEnglishScriptExpr()
            //
            // Description:
            // This function determines if the specified property has special
            // naming when used via Scripting. Otherwise, it'll use the same
            // as for expressions.
            //
            // Parameters:
            //   prop - Property or PropertyGroup object.
            //   matchName - String representing the property's match name to
            //       use for lookup.
            //   name - String representing the existing translation of the
            //       property name.
            //
            // Returns:
            // String representing the compact English equivalent for Scripting, if available.
            //
            function rd_GimmePropPath_getPropCompactEnglishScriptExpr(prop, matchName, name) {
                var translatedName = propCompactEnglishScriptingExprs[matchName];

                if (translatedName == undefined)
                    return rd_GimmePropPath_getPropCompactEnglishExpr(prop, matchName, name);
                else
                    return ("(" + name + ")");
            }


            var currProp = rd_GimmePropPathData.lastQueriedProp;

            if (currProp == null)
                return;

            // Get the preferred root object, and set a value representing it
            var rootObj;
            if (pal.grp.rootObj.rootObjApp.value)
                rootObj = 8;
            else if (pal.grp.rootObj.rootObjComp.value)
                rootObj = 6;
            else if (pal.grp.rootObj.rootObjLayer.value)
                rootObj = 4;

            var scriptRefCollapse = pal.grp.scriptRefMode.scriptRefCollapse.value;
            var refModeAbs = pal.grp.refMode.refModeAbs.value;
            var propNameRefsByMatchName = pal.grp.propNameRefs.propNameRefsByMatchName.value;
            var propNameRefsByName = pal.grp.propNameRefs.propNameRefsByName.value;
            var propNameRefsByIndex = pal.grp.propNameOpts.propNameRefsByIndex.value;
            var propNameCompactEnglish = pal.grp.propNameOpts.propNameCompactEnglish.value;

            // Traverse up the property tree from the current property, until reaching the layer
            var scriptCode = "", exprCode = "";
            var name, compactName, compactScriptName;

            while (currProp.parentProperty != null) {
                // Reference by property index
                if ((currProp.parentProperty.propertyType == PropertyType.INDEXED_GROUP) && propNameRefsByIndex)
                    name = currProp.propertyIndex;
                else {
                    // Reference by match name or name
                    if (propNameRefsByMatchName) // && (currProp.parentProperty.propertyType == PropertyType.NAMED_GROUP))
                        name = "\"" + ((currProp.matchName != "") ? currProp.matchName : currProp.name) + "\"";
                    else
                        name = "\"" + currProp.name + "\"";
                }

                //alert('"'+currProp.name+'" = "'+currProp.matchName+'"; name="'+name+'", exprCode="'+exprCode+'"');

                // For compact English conversion, check for compact English equivalent
                if (propNameCompactEnglish) {
                    compactName = rd_GimmePropPath_getPropCompactEnglishExpr(currProp, currProp.matchName, name);
                    compactScriptName = rd_GimmePropPath_getPropCompactEnglishScriptExpr(currProp, currProp.matchName, name);

                    scriptCode = compactScriptName + scriptCode;
                    exprCode = compactName + exprCode;
                }
                else {
                    scriptCode = (scriptRefCollapse ? "" : ".property") + "(" + name + ")" + scriptCode;
                    exprCode = "(" + name + ")" + exprCode;
                }

                // Traverse up the property tree
                currProp = currProp.parentProperty;
            }

            // Prefix the layer reference, if requested
            if (rootObj >= 4)				// Root Object = Layer
            {
                name = (propNameRefsByIndex) ? currProp.index : "\"" + currProp.name + "\"";

                if (propNameCompactEnglish) {
                    // If the sub-layer property is a property group, add the missing period
                    scriptCode = "layer(" + name + ")" + (((currProp != null) && (currProp.propertyType != PropertyType.PROPERTY)) ? "." : "") + scriptCode;

                    if (rootObj > 4)
                        exprCode = "layer(" + name + ")." + exprCode;
                    else
                        exprCode = "thisLayer." + exprCode;
                }
                else {
                    scriptCode = "layer(" + name + ")" + scriptCode;

                    if (refModeAbs || (rootObj > 4))
                        exprCode = "layer(" + name + ")" + exprCode;
                    else
                        exprCode = "thisLayer" + exprCode;
                }
            }

            // Prefix the comp reference, if requested
            if (rootObj >= 6)				// Root Object = Comp
            {
                // Determine the comp's item number in the Project window
                var compItemNum = rd_GimmePropPath_findCompItemNum(app.project.activeItem);
                //alert("item# "+compItemNum);

                scriptCode = "item(" + compItemNum + ")." + scriptCode;
                if (refModeAbs)
                    exprCode = "comp(\"" + app.project.activeItem.name + "\")." + exprCode;
                else
                    exprCode = "thisComp." + exprCode;
            }

            // Prefix the application and project references, if requested, for the script code
            if (rootObj >= 8)				// Root Object = Application
                scriptCode = "app.project." + scriptCode;

            // Update the code fields
            pal.grp.viaScript.viaScriptCode.text = scriptCode;
            pal.grp.viaExpr.viaExprCode.text = exprCode;
        }


        // rd_GimmePropPath_doGetPropPath()
        //
        // Description:
        // This callback function retrieves the currently selected property or property
        // group, and displays the corresponding scripting and expression code to
        // access it.
        //
        // Parameters:
        // None.
        //
        // Returns:
        // Nothing.
        //
        function rd_GimmePropPath_doGetPropPath() {
            // rd_GimmePropPath_findDeepestSelectedProp()
            //
            // Description:
            // This function determines the deepest selected property or property group.
            // Assumes a single composition is selected or active.
            //
            // Parameters:
            // None
            //
            // Returns:
            // Property or PropertyGroup object if successful; null if no property or
            // property group, or if multiple of them, are selected.
            //
            function rd_GimmePropPath_findDeepestSelectedProp() {
                var comp = app.project.activeItem;
                var deepestProp, numDeepestProps = 0, deepestPropDepth = 0;
                var prop;

                for (var i = 0; i < comp.selectedProperties.length; i++) {
                    prop = comp.selectedProperties[i];

                    if (prop.propertyDepth >= deepestPropDepth) {
                        if (prop.propertyDepth > deepestPropDepth)
                            numDeepestProps = 0;
                        deepestProp = prop;
                        numDeepestProps++;
                        deepestPropDepth = prop.propertyDepth;
                    }
                    else
                        continue;
                }

                return (numDeepestProps > 1) ? null : deepestProp;
            }


            var prop;
            var rootObj;

            // Check that a single comp is selected or active
            if ((app.project.activeItem == null) || !(app.project.activeItem instanceof CompItem)) {
                alert(rd_GimmePropPath_localize(rd_GimmePropPathData.strErrNoCompSel), rd_GimmePropPathData.scriptName);
                return;
            }

            // Check that a single deep property is selected
            prop = rd_GimmePropPath_findDeepestSelectedProp();
            if (prop == null) {
                alert(rd_GimmePropPath_localize(rd_GimmePropPathData.strErrNoSinglePropSel), rd_GimmePropPathData.scriptName);
                return;
            }
            rd_GimmePropPathData.lastQueriedProp = prop;

            //alert("deepest prop/group = '"+prop.name+"' (depth="+prop.propertyDepth+")");

            // Enable the Test button
            this.parent.parent.viaScript.heading.viaScriptCodeTest.enabled = true;

            // Check if expression is usable
            if ((prop.propertyType == PropertyType.PROPERTY) && (prop.propertyValueType == PropertyValueType.CUSTOM_VALUE))
                this.parent.parent.viaExpr.heading.viaExprMsg.text = rd_GimmePropPath_localize(rd_GimmePropPathData.strErrExprNotFunc);
            else
                this.parent.parent.viaExpr.heading.viaExprMsg.text = "";

            // Build the property path
            rd_GimmePropPath_buildPropPath(this.parent.parent.parent);
        }


        // main code:
        //

        // Prerequisites check
        if (parseFloat(app.version) < 8.0)
            alert(rd_GimmePropPath_localize(rd_GimmePropPathData.strMinAE80), rd_GimmePropPathData.scriptName);
        else {
            // Build and show the palette
            var rdgppPal = rd_GimmePropPath_buildUI(thisObj);
            if (rdgppPal != null) {
                // Update UI values, if saved in the settings
                if (app.settings.haveSetting("redefinery", "rd_GimmePropPath_rootObj")) {
                    switch (app.settings.getSetting("redefinery", "rd_GimmePropPath_rootObj")) {
                        case "app":
                            rdgppPal.grp.rootObj.rootObjApp.value = true;
                            break;
                        case "comp":
                            rdgppPal.grp.rootObj.rootObjComp.value = true;
                            break;
                        case "layer":
                            rdgppPal.grp.rootObj.rootObjLayer.value = true;
                            break;
                        default:
                            break;
                    }
                }
                if (app.settings.haveSetting("redefinery", "rd_GimmePropPath_propRefsBy")) {
                    switch (app.settings.getSetting("redefinery", "rd_GimmePropPath_propRefsBy")) {
                        case "matchName":
                            rdgppPal.grp.propNameRefs.propNameRefsByMatchName.value = true;
                            break;
                        case "name":
                            rdgppPal.grp.propNameRefs.propNameRefsByName.value = true;
                            break;
                        default:
                            break;
                    }
                }
                if (app.settings.haveSetting("redefinery", "rd_GimmePropPath_propRefsByIndex"))
                    rdgppPal.grp.propNameOpts.propNameRefsByIndex.value = (app.settings.getSetting("redefinery", "rd_GimmePropPath_propRefsByIndex") == "false") ? false : true;
                if (app.settings.haveSetting("redefinery", "rd_GimmePropPath_propNameCompactEnglish"))
                    rdgppPal.grp.propNameOpts.propNameCompactEnglish.value = (app.settings.getSetting("redefinery", "rd_GimmePropPath_propNameCompactEnglish") == "false") ? false : true;
                if (app.settings.haveSetting("redefinery", "rd_GimmePropPath_scriptRefCollapse"))
                    rdgppPal.grp.scriptRefMode.scriptRefCollapse.value = (app.settings.getSetting("redefinery", "rd_GimmePropPath_scriptRefCollapse") == "false") ? false : true;

                if (app.settings.haveSetting("redefinery", "rd_GimmePropPath_exprRefMode")) {
                    switch (app.settings.getSetting("redefinery", "rd_GimmePropPath_exprRefMode")) {
                        case "abs":
                            rdgppPal.grp.refMode.refModeAbs.value = true;
                            break;
                        case "rel":
                            rdgppPal.grp.refMode.refModeRel.value = true;
                            break;
                        default:
                            break;
                    }
                }

                // Save current UI settings upon closing the palette
                rdgppPal.onClose = function () {
                    var value = "";
                    if (rdgppPal.grp.rootObj.rootObjApp.value)
                        value = "app";
                    else if (rdgppPal.grp.rootObj.rootObjComp.value)
                        value = "comp";
                    else if (rdgppPal.grp.rootObj.rootObjLayer.value)
                        value = "layer";
                    app.settings.saveSetting("redefinery", "rd_GimmePropPath_rootObj", value);

                    value = "";
                    if (rdgppPal.grp.propNameRefs.propNameRefsByMatchName.value)
                        value = "matchName";
                    else if (rdgppPal.grp.propNameRefs.propNameRefsByName.value)
                        value = "name";
                    app.settings.saveSetting("redefinery", "rd_GimmePropPath_propRefsBy", value);

                    app.settings.saveSetting("redefinery", "rd_GimmePropPath_propRefsByIndex", rdgppPal.grp.propNameOpts.propNameRefsByIndex.value);
                    app.settings.saveSetting("redefinery", "rd_GimmePropPath_propNameCompactEnglish", rdgppPal.grp.propNameOpts.propNameCompactEnglish.value);
                    app.settings.saveSetting("redefinery", "rd_GimmePropPath_scriptRefCollapse", rdgppPal.grp.scriptRefMode.scriptRefCollapse.value);

                    value = "";
                    if (rdgppPal.grp.refMode.refModeAbs.value)
                        value = "abs";
                    else if (rdgppPal.grp.refMode.refModeRel.value)
                        value = "rel";
                    app.settings.saveSetting("redefinery", "rd_GimmePropPath_exprRefMode", value);
                }

                if (rdgppPal instanceof Window) {
                    // Show the palette
                    rdgppPal.center();
                    rdgppPal.show();
                }
                else
                    rdgppPal.layout.layout(true);
            }
        }
    }


    rd_GimmePropPath(this);
}