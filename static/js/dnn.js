var dnn;	//should really make this m_dnn... but want to treat like namespace

var DNN_HIGHLIGHT_COLOR = '#9999FF';
var COL_DELIMITER = String.fromCharCode(18);
var ROW_DELIMITER = String.fromCharCode(17);
var QUOTE_REPLACEMENT = String.fromCharCode(19);

if (typeof(__dnn_m_aNamespaces) == 'undefined')	//include in each DNN ClientAPI namespace file for dependency loading
	var __dnn_m_aNamespaces = new Array();

//NameSpace DNN
	function __dnn()
	{
		this.apiversion = .1;
		this.pns = '';
		this.ns = 'dnn';
		this.diagnostics = null;
		this.vars = null;
		this.dependencies = new Array();
		this.isLoaded = false;

		this.delay = new Array();
	}
	
	__dnn.prototype.getVars = function()
	{
		if (this.vars == null)
		{
			this.vars = new Array();
			var oCtl = dnn.dom.getById('__dnnVariable');
			if (oCtl != null)
			{
				if (oCtl.value.indexOf('__scdoff') != -1)
				{
					//browsers like MacIE don't support char(18) very well... need to use multichars
					COL_DELIMITER = '~|~';
					ROW_DELIMITER = '~`~';
					QUOTE_REPLACEMENT = '~!~';
				}
			
				var aryItems = oCtl.value.split(ROW_DELIMITER);
				for (var i=0; i<aryItems.length; i++)
				{
					var aryItem = aryItems[i].split(COL_DELIMITER);
					
					if (aryItem.length == 2)
						this.vars[aryItem[0]] = aryItem[1];
				}
			}
		}
		return this.vars;	
	}

	__dnn.prototype.getVar = function(sKey)
	{
		if (this.getVars()[sKey] != null)
		{
			var re = eval('/' + QUOTE_REPLACEMENT + '/g');
			return this.getVars()[sKey].replace(re, '"');
		}
	}

	__dnn.prototype.setVar = function(sKey, sVal)
	{			
		if (this.vars == null)
			this.getVars();			
		this.vars[sKey] = sVal;
		var oCtl = dnn.dom.getById('__dnnVariable');
		if (oCtl == null)
		{
			oCtl = dnn.dom.createElement('INPUT');
			oCtl.type = 'hidden';
			oCtl.id = '__dnnVariable';
			dnn.dom.appendChild(dnn.dom.getByTagName("body")[0], oCtl);		
		}
		var sVals = '';
		var sKey
		for (sKey in this.vars)
		{
			sVals += ROW_DELIMITER + sKey + COL_DELIMITER + this.vars[sKey];
		}
		oCtl.value = sVals;
		return true;
	}

	__dnn.prototype.callPostBack = function(sAction)
	{
		var sPostBack = dnn.getVar('__dnn_postBack');
		var sData = '';
		if (sPostBack.length > 0)
		{
			sData += sAction;
			for (var i=1; i<arguments.length; i++)
			{
				var aryParam = arguments[i].split('=');
				sData += COL_DELIMITER + aryParam[0] + COL_DELIMITER + aryParam[1];
			}
			eval(sPostBack.replace('[DATA]', sData));
			return true;
		}
		return false;
	}

	__dnn.prototype.doDelay = function (sType, iTime, pFunc, oContext) 
	{
		if (this.delay[sType] == null)
		{
			this.delay[sType] = new dnn.delayObject(pFunc, oContext, sType);
			this.delay[sType].num = window.setTimeout(dnn.dom.getObjMethRef(this.delay[sType], 'complete'), iTime);
		}
	}

	__dnn.prototype.cancelDelay = function (sType) 
	{
		if (this.delay[sType] != null)
		{
			window.clearTimeout(this.delay[sType].num);
			this.delay[sType] = null;
		}
	}

	__dnn.prototype.delayObject = function (pFunc, oContext, sType)
	{
		this.num = null;
		this.pfunc = pFunc;
		this.context = oContext;
		this.type = sType;
	}

	__dnn.prototype.escapeForEval = function(s)	//needs work...
	{
		return s.replace(/\'/g, "\\'").replace(/\\/g, '\\\\').replace(/\r/g, '').replace(/\n/g, '\\n').replace(/\./, '\\.');
	}

	__dnn.prototype.delayObject.prototype.complete = function ()
	{
		dnn.delay[this.type] = null;
		this.pfunc(this.context);
	}

	__dnn.prototype.dependenciesLoaded = function()
	{
		return true;
	}

	__dnn.prototype.loadNamespace = function ()
	{
		if (this.isLoaded == false)
		{
			if (this.dependenciesLoaded())
			{
				dnn = this; 
				this.isLoaded = true;
				this.loadDependencies(this.pns, this.ns);
			}
		}	
	}

	__dnn.prototype.loadDependencies = function (sPNS, sNS)
	{
		for (var i=0; i<__dnn_m_aNamespaces.length; i++)
		{
			for (var iDep=0; iDep<__dnn_m_aNamespaces[i].dependencies.length; iDep++)
			{
				if (__dnn_m_aNamespaces[i].dependencies[iDep] == sPNS + (sPNS.length>0 ? '.': '') + sNS)
					__dnn_m_aNamespaces[i].loadNamespace();
			}
		}
	}


	//--- dnn.dom
		function dnn_dom()
		{
			this.pns = 'dnn';
			this.ns = 'dom';
			this.dependencies = 'dnn'.split(',');
			this.isLoaded = false;
			this.browser = new this.browserObject();
			this.__leakEvts = new Array();			
		}

		dnn_dom.prototype.appendChild = function (oParent, oChild) 
		{
			if (oParent.appendChild) 
				return oParent.appendChild(oChild);
			else 
				return null;
		}

		dnn_dom.prototype.attachEvent = function (oCtl, sType, fHandler) 
		{
			if (dnn.dom.browser.isType(dnn.dom.browser.InternetExplorer) == false)
			{
				var sName = sType.substring(2);
				oCtl.addEventListener(sName, function (evt) {dnn.dom.event = new dnn.dom.eventObject(evt, evt.target); return fHandler();}, false);
			}
			else
				oCtl.attachEvent(sType, function () {dnn.dom.event = new dnn.dom.eventObject(window.event, window.event.srcElement); return fHandler();});
			return true;
		}		

		dnn_dom.prototype.createElement = function (sTagName) 
		{
			if (document.createElement) 
				return document.createElement(sTagName);
			else 
				return null;
		}

		dnn_dom.prototype.cancelCollapseElement = function (oCtl)
		{
			dnn.cancelDelay(oCtl.id + 'col');
			oCtl.style.display = 'none';
		}
		
		dnn_dom.prototype.collapseElement = function (oCtl, iNum, pCallBack) 
		{
			if (iNum == null)
				iNum = 10;
			oCtl.style.overflow = 'hidden';
			var oContext = new Object();
			oContext.num = iNum;
			oContext.ctl = oCtl;
			oContext.pfunc = pCallBack;
			oCtl.origHeight = oCtl.offsetHeight;
			dnn.dom.__collapseElement(oContext);
		}
		
		dnn_dom.prototype.__collapseElement = function (oContext) 
		{
			var iNum = oContext.num;
			var oCtl = oContext.ctl;
			
			var iStep = oCtl.origHeight / iNum;
			if (oCtl.offsetHeight - (iStep*2) > 0)
			{
				oCtl.style.height = oCtl.offsetHeight - iStep;
				dnn.doDelay(oCtl.id + 'col', 10, dnn.dom.__collapseElement, oContext);
			}
			else
			{
				oCtl.style.display = 'none';
				if (oContext.pfunc != null)
					oContext.pfunc();
			}
		}

		dnn_dom.prototype.cancelExpandElement = function (oCtl)
		{
			dnn.cancelDelay(oCtl.id + 'exp');
			oCtl.style.overflow = '';
			oCtl.style.height = '';			
		}
		
		dnn_dom.prototype.expandElement = function (oCtl, iNum, pCallBack) 
		{
			if (iNum == null)
				iNum = 10;
			
			if (oCtl.style.display == 'none' && oCtl.origHeight == null)
			{
				oCtl.style.display = '';
				oCtl.style.overflow = '';
				oCtl.origHeight = oCtl.offsetHeight;
				oCtl.style.overflow = 'hidden';
				oCtl.style.height = 1;
			}
			oCtl.style.display = '';

			var oContext = new Object();
			oContext.num = iNum;
			oContext.ctl = oCtl;
			oContext.pfunc = pCallBack;
			dnn.dom.__expandElement(oContext);
		}

		dnn_dom.prototype.__expandElement = function (oContext) 
		{
			var iNum = oContext.num;
			var oCtl = oContext.ctl;
			var iStep = oCtl.origHeight / iNum;
			if (oCtl.offsetHeight + iStep < oCtl.origHeight)
			{
				oCtl.style.height = oCtl.offsetHeight + iStep;
				dnn.doDelay(oCtl.id + 'exp', 10, dnn.dom.__expandElement, oContext);
			}
			else
			{
				oCtl.style.overflow = '';
				oCtl.style.height = '';
				if (oContext.pfunc != null)
					oContext.pfunc();
			}				
		}
		
		dnn_dom.prototype.deleteCookie = function (sName, sPath, sDomain) 
		{
			if (this.getCookie(sName)) 
			{
				this.setCookie(sName, '', -1, sPath, sDomain);
				return true;
			}
			return false;
		}

		dnn_dom.prototype.getById = function (sID, oCtl)
		{
			if (oCtl == null)
				oCtl = document;
			if (oCtl.getElementById) //(dnn.dom.browser.isType(dnn.dom.browser.InternetExplorer) == false)
				return oCtl.getElementById(sID);
			else
				return oCtl.all(sID);
		}

		dnn_dom.prototype.getByTagName = function (sTag, oCtl)
		{
			if (oCtl == null)
				oCtl = document;
			if (oCtl.getElementsByTagName) //(dnn.dom.browser.type == dnn.dom.browser.InternetExplorer)
				return oCtl.getElementsByTagName(sTag);
			else if (oCtl.all.tags)
				return oCtl.all.tags(sTag);
			else
				return null;
		}

		dnn_dom.prototype.getCookie = function (sName) 
		{
			var sCookie = " " + document.cookie;
			var sSearch = " " + sName + "=";
			var sStr = null;
			var iOffset = 0;
			var iEnd = 0;
			if (sCookie.length > 0) 
			{
				iOffset = sCookie.indexOf(sSearch);
				if (iOffset != -1) 
				{
					iOffset += sSearch.length;
					iEnd = sCookie.indexOf(";", iOffset)
					if (iEnd == -1) 
						iEnd = sCookie.length;
					sStr = unescape(sCookie.substring(iOffset, iEnd));
				}
			}
			return(sStr);
		}

		dnn_dom.prototype.getNonTextNode = function (oNode)
		{
			if (this.isNonTextNode(oNode))	
				return oNode;
			
			while (oNode != null && this.isNonTextNode(oNode))
			{
				oNode = this.getSibling(oNode, 1);
			}
			return oNode;
		}

		dnn_dom.prototype.__leakEvt = function (sName, oCtl, oPtr)
		{
			this.name = sName;
			this.ctl = oCtl;
			this.ptr = oPtr;
		}
		
		dnn_dom.prototype.addSafeHandler = function (oDOM, sEvent, oObj, sMethod)
		{
			oDOM[sEvent] = this.getObjMethRef(oObj, sMethod);			

			if (dnn.dom.browser.isType(dnn.dom.browser.InternetExplorer))	//handle IE memory leaks with closures
			{
				if (this.__leakEvts.length == 0)
					dnn.dom.attachEvent(window, 'onunload', dnn.dom.destroyHandlers);

				this.__leakEvts[this.__leakEvts.length] = new dnn.dom.__leakEvt(sEvent, oDOM, oDOM[sEvent]);
			}
		}
		
		dnn_dom.prototype.destroyHandlers = function ()	//handle IE memory leaks with closures
		{
			var iCount = dnn.dom.__leakEvts.length-1;
			for (var i=iCount; i>=0; i--)
			{
				var oEvt = dnn.dom.__leakEvts[i];
				oEvt.ctl.detachEvent(oEvt.name, oEvt.ptr);
				oEvt.ctl[oEvt.name] = null;
				dnn.dom.__leakEvts.length = dnn.dom.__leakEvts.length - 1;
			}
		}
		
		//http://jibbering.com/faq/faq_notes/closures.html (associateObjWithEvent)
		dnn_dom.prototype.getObjMethRef = function (obj, methodName)
		{
			return (function(e)	{e = e||window.event; return obj[methodName](e, this); } );
		}

		dnn_dom.prototype.getSibling = function (oCtl, iOffset)
		{
			if (oCtl != null && oCtl.parentNode != null)
			{
				for (var i=0; i<oCtl.parentNode.childNodes.length; i++)
				{
					if (oCtl.parentNode.childNodes[i].id == oCtl.id)
					{
						if (oCtl.parentNode.childNodes[i + iOffset] != null)
							return oCtl.parentNode.childNodes[i + iOffset];
					}
				}
			}
		}
	
		dnn_dom.prototype.isNonTextNode = function (oNode)
		{
			return (oNode.nodeType != 3 && oNode.nodeType != 8); //exclude nodeType of Text (Netscape/Mozilla) issue!
		}
		
		dnn_dom.prototype.navigate = function (sURL, sTarget)
		{
			if (sTarget != null && sTarget.length > 0)
			{
				if (sTarget == '_blank')	//todo: handle more
					window.open(sURL);
				else
					document.frames[sTarget].location.href = sURL;
			}
			else
				window.location.href = sURL;
			return false;
		}
		
		
		dnn_dom.prototype.removeChild = function (oChild) 
		{
			if (oChild.parentNode.removeChild) 
				return oChild.parentNode.removeChild(oChild);
			else 
				return null;
		}


		dnn_dom.prototype.setCookie = function (sName, sVal, iDays, sPath, sDomain, bSecure) 
		{
			var sExpires;
			if (iDays)
			{
				sExpires = new Date();
				sExpires.setTime(sExpires.getTime()+(iDays*24*60*60*1000));
			}
			document.cookie = sName + "=" + escape(sVal) + ((sExpires) ? "; expires=" + sExpires : "") + 
				((sPath) ? "; path=" + sPath : "") + ((sDomain) ? "; domain=" + sDomain : "") + ((bSecure) ? "; secure" : "");
			
			if (document.cookie.length > 0)
				return true;
				
		}

		dnn_dom.prototype.getCurrentStyle = function (oNode, prop) 
		{
			if (document.defaultView) 
			{
				if (oNode.nodeType != oNode.ELEMENT_NODE) return null;
				return document.defaultView.getComputedStyle(oNode,'').getPropertyValue(prop.split('-').join(''));
			}
			if (oNode.currentStyle) 
				return oNode.currentStyle[prop.split('-').join('')];
			if (oNode.style) 
				return oNode.style.getAttribute(prop.split('-').join(''));  // We need to get rid of slashes
			return null;
		}

		dnn_dom.prototype.dependenciesLoaded = function()
		{
			return (typeof(dnn) != 'undefined');
		}

		dnn_dom.prototype.loadNamespace = function ()
		{
			if (this.isLoaded == false)
			{
				if (this.dependenciesLoaded())
				{
					dnn.dom = this; 
					this.isLoaded = true;
					dnn.loadDependencies(this.pns, this.ns);
				}
			}	
		}

		dnn_dom.prototype.eventObject = function (e, srcElement)
		{
			this.object = e;
			this.srcElement = srcElement;
		}


		//--- dnn.dom.browser
		dnn_dom.prototype.browserObject = function()
		{
			this.InternetExplorer = 'ie';
			this.Netscape = 'ns';
			this.Mozilla = 'mo';
			this.Opera = 'op';
			this.Safari = 'safari';
			this.Konqueror = 'kq';
			this.MacIE = 'macie';
			
			//Please offer a better solution if you have one!
			var sType;
			var agt=navigator.userAgent.toLowerCase();

			if (agt.indexOf('konqueror') != -1) 
				sType = this.Konqueror;
			else if (agt.indexOf('opera') != -1) 
				sType = this.Opera;
			else if (agt.indexOf('netscape') != -1) 
				sType = this.Netscape;
			else if (agt.indexOf('msie') != -1)
			{
				if (agt.indexOf('mac') != -1)
					sType = this.MacIE;
				else
					sType = this.InternetExplorer;
			}
			else if (agt.indexOf('safari') != -1)
				sType = 'safari';
			
			if (sType == null)
				sType = this.Mozilla;  
			
			this.type = sType;
			this.version = parseFloat(navigator.appVersion);
			
			var sAgent = navigator.userAgent.toLowerCase();
			if (this.type == this.InternetExplorer)
			{
				var temp=navigator.appVersion.split("MSIE");
				this.version=parseFloat(temp[1]);
			}
			if (this.type == this.Netscape)
			{
				var temp=sAgent.split("netscape");
				this.version=parseFloat(temp[1].split("/")[1]);	
			}

			//this.majorVersion = null;
			//this.minorVersion = null;
		}
		
		dnn_dom.prototype.browserObject.prototype.toString = function ()
		{
			return this.type + ' ' + this.version;
		}
		
		dnn_dom.prototype.browserObject.prototype.isType = function ()
		{
			for (var i=0; i<arguments.length; i++)
			{
				if (dnn.dom.browser.type == arguments[i])
					return true;
			}
			return false;
		}
	
		//--- End dnn.dom.browser
						
	//--- End dnn.dom

	//--- dnn.controls - not enough here to justify separate js file
	//if (typeof(dnn_controltree) != 'undefined')
	//	dnn_controls.prototype = new dnn_controltree();
	//if (typeof(dnn_control) != 'undefined')
	//	dnn_controls.prototype = new dnn_control;
	
	function dnn_controls()
	{
		this.pns = 'dnn';
		this.ns = 'controls';
		this.dependencies = 'dnn,dnn.dom,dnn.xml'.split(',');
		this.isLoaded = false;
		this.controls = new Array();
		
		this.orient = new Object();
		this.orient.horizontal = 0;
		this.orient.vertical = 1;
		
		this.action = new Object();
		this.action.postback = 0;
		this.action.expand = 1;
		this.action.none = 2;
		this.action.nav = 3;
	}

	dnn_controls.prototype.dependenciesLoaded = function()
	{
		return (typeof(dnn) != 'undefined' && typeof(dnn.dom) != 'undefined' && typeof(dnn.xml) != 'undefined');
	}

	dnn_controls.prototype.loadNamespace = function ()
	{
		if (this.isLoaded == false)
		{
			if (this.dependenciesLoaded())
			{				
				if (typeof(dnn_control) != 'undefined')
				{
					dnn_controls.prototype = new dnn_control;
					dnn_controls.prototype.constructor = dnn_control;				
				}	
				dnn.controls = new dnn_controls(); 	
				dnn.controls.isLoaded = true;
				dnn.loadDependencies(this.pns, this.ns);
			}
		}	
	}
	//--- End dnn.controls
	
//--- End dnn


//load namespaces
__dnn_m_aNamespaces[__dnn_m_aNamespaces.length] = new dnn_controls();
__dnn_m_aNamespaces[__dnn_m_aNamespaces.length] = new dnn_dom();
__dnn_m_aNamespaces[__dnn_m_aNamespaces.length] = new __dnn();
for (var i=__dnn_m_aNamespaces.length-1; i>=0; i--)
	__dnn_m_aNamespaces[i].loadNamespace();
