/* -*- Mode: C++; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4 -*-
 * The contents of this file are subject to the Netscape Public
 * License Version 1.1 (the "License"); you may not use this file
 * except in compliance with the License. You may obtain a copy of
 * the License at http://www.mozilla.org/NPL/
 *
 * Software distributed under the License is distributed on an "AS
 * IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing
 * rights and limitations under the License.
 *
 * The Original Code is Mozilla Communicator client code, released
 * March 31, 1998.
 *
 * The Initial Developer of the Original Code is Netscape
 * Communications Corporation. Portions created by Netscape are
 * Copyright (C) 1998-1999 Netscape Communications Corporation. All
 * Rights Reserved.
 */


/*
 * Command-specific code. This stuff should be called by the widgets
 */

//NOTE: gMessengerBundle and gBrandBundle must be defined and set
//      for this Overlay to work properly

var gFolderJustSwitched = false;
var gBeforeFolderLoadTime;
var gRDFNamespace = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";

/* keep in sync with nsMsgFolderFlags.h */
var MSG_FOLDER_FLAG_TRASH = 0x0100;
var MSG_FOLDER_FLAG_SENTMAIL = 0x0200
var MSG_FOLDER_FLAG_DRAFTS = 0x0400;
var MSG_FOLDER_FLAG_QUEUE = 0x0800;
var MSG_FOLDER_FLAG_TEMPLATES = 0x400000;

var gPrefs;

function OpenURL(url)
{
  //dump("\n\nOpenURL from XUL\n\n\n");
  messenger.SetWindow(window, msgWindow);
  messenger.OpenURL(url);
}

function GetMsgFolderFromNode(folderNode)
{
  var folderURI = folderNode.getAttribute("id");
  return GetMsgFolderFromURI(folderURI);
}

function GetMsgFolderFromURI(folderURI)
{
  var folderResource = RDF.GetResource(folderURI);
  if(folderResource)
  {
    var msgFolder = folderResource.QueryInterface(Components.interfaces.nsIMsgFolder);
    return msgFolder;
  }

  return null;
}

function GetServer(uri)
{
    if (!uri) return null;
    try {
        var folder = GetMsgFolderFromUri(uri);
        return folder.server;
    }
    catch (ex) {
        dump("GetServer("+uri+") failed, ex="+ex+"\n");
    }
    return null;
}

function LoadMessageByUri(uri)
{
    dump("XXX LoadMessageByUri " + uri + " vs " + gCurrentDisplayedMessage + "\n");
  if(uri != gCurrentDisplayedMessage)
  {
        dump("fix this, get the nsIMsgDBHdr and the nsIMsgFolder from the uri...\n");
/*
    var resource = RDF.GetResource(uri);
    var message = resource.QueryInterface(Components.interfaces.nsIMessage);
    if (message)
      setTitleFromFolder(message.msgFolder, message.mimef2DecodedSubject);

    var nsIMsgFolder = Components.interfaces.nsIMsgFolder;
    if (message.msgFolder.server.downloadOnBiff)
      message.msgFolder.biffState = nsIMsgFolder.nsMsgBiffState_NoMail;
*/

    gCurrentDisplayedMessage = uri;
    gHaveLoadedMessage = true;
    OpenURL(uri);
  }

}

function ChangeFolderByDOMNode(folderNode)
{
  var uri = folderNode.getAttribute('id');
  dump(uri + "\n");
  if (!uri) return;

  var sortType = folderNode.getAttribute('sortType');
  var sortOrder = folderNode.getAttribute('sortOrder');
  var viewFlags = folderNode.getAttribute('viewFlags');
  var viewType = folderNode.getAttribute('viewType');

  ChangeFolderByURI(uri, viewType, viewFlags, sortType, sortOrder);
}

function setTitleFromFolder(msgfolder, subject)
{
    if (!msgfolder) return;

    var title;
    var server = msgfolder.server;

    if (null != subject)
      title = subject+" - ";
    else
      title = "";

    if (msgfolder.isServer) {
            // <hostname>
            title += server.hostName;
    }
    else {
        var middle;
        var end;
        if (server.type == "nntp") {
            // <folder> on <hostname>
            middle = gMessengerBundle.getString("titleNewsPreHost");
            end = server.hostName;
        } else {
            var identity;
            try {
                var identities = accountManager.GetIdentitiesForServer(server);

                identity = identities.QueryElementAt(0, Components.interfaces.nsIMsgIdentity);
                // <folder> for <email>
                middle = gMessengerBundle.getString("titleMailPreHost");
                end = identity.email;
            } catch (ex) {
            }

        }

        title += msgfolder.prettyName;
        if (middle) title += " " + middle;
        if (end) title += " " + end;
    }

    title += " - " + gBrandBundle.getString("brandShortName");
    window.title = title;
}

function ChangeFolderByURI(uri, viewType, viewFlags, sortType, sortOrder)
{
  //dump("In ChangeFolderByURI uri = " + uri + " sortType = " + sortType + "\n");
  if (uri == gCurrentLoadingFolderURI)
    return;
  var resource = RDF.GetResource(uri);
  var msgfolder =
      resource.QueryInterface(Components.interfaces.nsIMsgFolder);

  try {
      setTitleFromFolder(msgfolder, null);
  } catch (ex) {
      dump("error setting title: " + ex + "\n");
  }

  //if it's a server, clear the threadpane and don't bother trying to load.
  if(msgfolder.isServer) {
    ClearThreadPane();

    // Load AccountCentral page here.
    ShowAccountCentral();
  return;
  }
  else
  {
    if (msgfolder.server.displayStartupPage)
    {
      gDisplayStartupPage = true;
      msgfolder.server.displayStartupPage = false;
    }
  }

  // If the user clicks on msgfolder, time to display thread pane and message pane.
  // Hide AccountCentral page
  if (gAccountCentralLoaded)
  {
      HideAccountCentral();
  }

  if (showPerformance) {
    gBeforeFolderLoadTime = new Date();
  }

  gCurrentLoadingFolderURI = uri;
  gNextMessageAfterDelete = null; // forget what message to select, if any

  if(msgfolder.manyHeadersToDownload())
  {
  try
  {
    SetBusyCursor(window, true);
    gCurrentFolderToReroot = uri;
    gCurrentLoadingFolderViewFlags = viewFlags;
    gCurrentLoadingFolderViewType = viewType;
    gCurrentLoadingFolderSortType = sortType;
    gCurrentLoadingFolderSortOrder = sortOrder;
    msgfolder.startFolderLoading();
    msgfolder.updateFolder(msgWindow);
  }
  catch(ex)
  {
        SetBusyCursor(window, false);
        dump("Error loading with many headers to download: " + ex + "\n");
  }
  }
  else
  {
    SetBusyCursor(window, true);
    gCurrentFolderToReroot = "";
    gCurrentLoadingFolderViewFlags = 0;  // is this correct?
    gCurrentLoadingFolderSortType = 0;  // is this correct?
    gCurrentLoadingFolderSortOrder = 0;  // is this correct?
    gCurrentLoadingFolderViewType = 0;  // is this correct?
    RerootFolder(uri, msgfolder, viewType, viewFlags, sortType, sortOrder);

    //Need to do this after rerooting folder.  Otherwise possibility of receiving folder loaded
    //notification before folder has actually changed.
    msgfolder.updateFolder(msgWindow);
  }

  document.commandDispatcher.updateCommands('mail-toolbar');
}

function isNewsURI(uri)
{
    if (!uri || uri[0] != 'n') {
        return false;
    }
    else {
        return ((uri.substring(0,6) == "news:/") || (uri.substring(0,14) == "news_message:/"));
    }
}

function RerootFolder(uri, newFolder, viewType, viewFlags, sortType, sortOrder)
{
  //dump("In reroot folder, sortType = " +  sortType + "\n");

  // workaround for #39655
  gFolderJustSwitched = true;

  ClearThreadPaneSelection();

  //Clear the new messages of the old folder
  var oldFolder = msgWindow.openFolder;
  if (oldFolder) {
    if (oldFolder.hasNewMessages) {
      oldFolder.clearNewMessages();
    }
  }

  //Set the window's new open folder.
  msgWindow.openFolder = newFolder;

  SetViewFlags(viewFlags);

  //the new folder being selected should have its biff state get cleared.
  if(newFolder)
  {
    newFolder.biffState =
          Components.interfaces.nsIMsgFolder.nsMsgBiffState_NoMail;
  }

  //Clear out the thread pane so that we can sort it with the new sort id without taking any time.
  // folder.setAttribute('ref', "");
   if (isNewsURI(uri))
       SetNewsFolderColumns(true);
   else
       SetNewsFolderColumns(false);

  // null this out, so we don't try sort.
  if (gDBView) {
    gDBView.close();
    gDBView = null;
  }

  // if this is the drafts, sent, or send later folder,
  // we show "Recipient" instead of "Author"
  SetSentFolderColumns(IsSpecialFolder(newFolder, MSG_FOLDER_FLAG_SENTMAIL | MSG_FOLDER_FLAG_DRAFTS | MSG_FOLDER_FLAG_QUEUE));

  // now create the db view, which will sort it.
  CreateDBView(newFolder, viewType, viewFlags, sortType, sortOrder);
  // that should have initialized gDBView, now re-root the thread pane
  var outlinerView = gDBView.QueryInterface(Components.interfaces.nsIOutlinerView);
  if (outlinerView)
  {
    var outliner = GetThreadOutliner();
    outliner.boxObject.QueryInterface(Components.interfaces.nsIOutlinerBoxObject).view = outlinerView;
  }

  SetUpToolbarButtons(uri);
  UpdateStatusMessageCounts(newFolder);
}

function SwitchView(command)
{
  var oldSortType = gDBView ? gDBView.sortType : nsMsgViewSortType.byThread;
  var oldSortOrder = gDBView ? gDBView.sortOrder : nsMsgViewSortOrder.ascending;
  var viewFlags = gCurViewFlags;

  // close existing view.
  if (gDBView) {
    gDBView.close();
    gDBView = null; 
  }

  switch(command)
  {
    case "cmd_viewUnreadMsgs":

      viewFlags = viewFlags | nsMsgViewFlagsType.kUnreadOnly;
      CreateDBView(msgWindow.openFolder, nsMsgViewType.eShowAllThreads, viewFlags,
            oldSortType, oldSortOrder );
    break;
    case "cmd_viewAllMsgs":
      viewFlags = viewFlags & ~nsMsgViewFlagsType.kUnreadOnly;
      CreateDBView(msgWindow.openFolder, nsMsgViewType.eShowAllThreads, viewFlags,
            oldSortType, oldSortOrder);
    break;
    case "cmd_viewThreadsWithUnread":
      CreateDBView(msgWindow.openFolder, nsMsgViewType.eShowThreadsWithUnread, nsMsgViewFlagsType.kThreadedDisplay,
            nsMsgViewSortType.byThread, nsMsgViewSortOrder.ascending);

    break;
    case "cmd_viewWatchedThreadsWithUnread":
      CreateDBView(msgWindow.openFolder, nsMsgViewType.eShowWatchedThreadsWithUnread, nsMsgViewFlagsType.kThreadedDisplay,
            nsMsgViewSortType.byThread, nsMsgViewSortOrder.ascending);
   break;
    case "cmd_viewIgnoredThreads":
      if (viewFlags & nsMsgViewFlagsType.kShowIgnored)
        viewFlags = viewFlags & ~nsMsgViewFlagsType.kShowIgnored;
      else
        viewFlags = viewFlags | nsMsgViewFlagsType.kShowIgnored;
      CreateDBView(msgWindow.openFolder, nsMsgViewType.eShowAllThreads, viewFlags,
            nsMsgViewSortType.byThread, nsMsgViewSortOrder.ascending);
    break;
  }

  // that should have initialized gDBView, now re-root the thread pane
  var outlinerView = gDBView.QueryInterface(Components.interfaces.nsIOutlinerView);
  if (outlinerView)
  {
    var outliner = GetThreadOutliner();
    outliner.boxObject.QueryInterface(Components.interfaces.nsIOutlinerBoxObject).view = outlinerView;
  }
}

function SetSentFolderColumns(isSentFolder)
{
  var senderOrRecipientColumn = document.getElementById("senderOrRecipientCol");

  if(isSentFolder)
  {
    senderOrRecipientColumn.setAttribute("label", gMessengerBundle.getString("recipientColumnHeader"));
  }
  else
  {
    senderOrRecipientColumn.setAttribute("label", gMessengerBundle.getString("senderColumnHeader"));
  }
}

function SetNewsFolderColumns(isNewsFolder)
{
  var sizeColumn = document.getElementById("sizeCol");

  if (isNewsFolder) {
     sizeColumn.setAttribute("label",gMessengerBundle.getString("linesColumnHeader"));
  }
  else {
     sizeColumn.setAttribute("label", gMessengerBundle.getString("sizeColumnHeader"));
  }
}

function UpdateStatusMessageCounts(folder)
{
  var unreadElement = GetUnreadCountElement();
  var totalElement = GetTotalCountElement();
  if(folder && unreadElement && totalElement)
  {
    var numUnread =
            gMessengerBundle.getFormattedString("unreadMsgStatus",
                                                [ folder.getNumUnread(false)]);
    var numTotal =
            gMessengerBundle.getFormattedString("totalMsgStatus",
                                                [folder.getTotalMessages(false)]);

    unreadElement.setAttribute("label", numUnread);
    totalElement.setAttribute("label", numTotal);

  }

}

function ConvertColumnIDToSortType(columnID)
{
  var sortKey;

  switch (columnID) {
    case "dateCol":
      sortKey = nsMsgViewSortType.byDate;
      break;
    case "senderOrRecipientCol":
      if (IsSpecialFolderSelected(MSG_FOLDER_FLAG_SENTMAIL | MSG_FOLDER_FLAG_DRAFTS | MSG_FOLDER_FLAG_QUEUE)) {
      	sortKey = nsMsgViewSortType.byRecipient;
      }
      else {
      	sortKey = nsMsgViewSortType.byAuthor;
      }
      break;
    case "subjectCol":
      sortKey = nsMsgViewSortType.bySubject;
      break;
    case "unreadButtonColHeader":
      sortKey = nsMsgViewSortType.byUnread;
      break;
    case "statusCol":
      sortKey = nsMsgViewSortType.byStatus;
      break;
    case "sizeCol":
      sortKey = nsMsgViewSortType.bySize;
      break;
    case "priorityCol":
      sortKey = nsMsgViewSortType.byPriority;
      break;
    case "flaggedCol":
      sortKey = nsMsgViewSortType.byFlagged;
      break;
    case "threadCol":
      sortKey = nsMsgViewSortType.byThread;
      break;
    default:
      dump("unsupported sort column: " + columnID + "\n");
      sortKey = 0;
      break;
  }
  return sortKey;
}

function ConvertSortTypeToColumnID(sortKey)
{
  var columnID;

  // hack to turn this into an integer, if it was a string
  // it would be a string if it came from localStore.rdf
  sortKey = sortKey - 0;

  switch (sortKey) {
    case nsMsgViewSortType.byDate:
      columnID = "dateCol";
      break;
    case nsMsgViewSortType.byAuthor:
    case nsMsgViewSortType.byRecipient:
      columnID = "senderOrRecipientCol";
      break;
    case nsMsgViewSortType.bySubject:
      columnID = "subjectCol";
      break;
    case nsMsgViewSortType.byUnread:
      columnID = "unreadButtonColHeader";
      break;
    case nsMsgViewSortType.byStatus:
      columnID = "statusCol";
      break;
    case nsMsgViewSortType.bySize:
      columnID = "sizeCol";
      break;
    case nsMsgViewSortType.byPriority:
      columnID = "priorityCol";
      break;
    case nsMsgViewSortType.byFlagged:
      columnID = "flaggedCol";
      break;
    case nsMsgViewSortType.byThread:
      columnID = "threadCol";
      break;
    case nsMsgViewSortType.byId:
      // there is no orderReceivedCol, so return null
      columnID = null;
      break;
    default:
      dump("unsupported sort key: " + sortKey + "\n");
      columnID = null;
      break;
  }
  return columnID;
}

var nsMsgViewSortType = Components.interfaces.nsMsgViewSortType;
var nsMsgViewSortOrder = Components.interfaces.nsMsgViewSortOrder;
var nsMsgViewFlagsType = Components.interfaces.nsMsgViewFlagsType;
var nsMsgViewCommandType = Components.interfaces.nsMsgViewCommandType;
var nsMsgViewType = Components.interfaces.nsMsgViewType;
var nsMsgNavigationType = Components.interfaces.nsMsgNavigationType;

var gDBView = null;
var gCurViewFlags;
var gCurSortType;

// CreateDBView is called when we have a thread pane. CreateBareDBView is called when there is no
// outliner associated with the view. CreateDBView will call into CreateBareDBView...

function CreateBareDBView(msgFolder, viewType, viewFlags, sortType, sortOrder)
{
  var dbviewContractId = "@mozilla.org/messenger/msgdbview;1?type=";

  // hack to turn this into an integer, if it was a string
  // it would be a string if it came from localStore.rdf
  viewType = viewType - 0;

  switch (viewType) {
      case nsMsgViewType.eShowThreadsWithUnread:
          dbviewContractId += "threadswithunread";
          break;
      case nsMsgViewType.eShowWatchedThreadsWithUnread:
          dbviewContractId += "watchedthreadswithunread";
          break;
      case nsMsgViewType.eShowAllThreads:
      default:
          dbviewContractId += "threaded";
          break;
  }

  gDBView = Components.classes[dbviewContractId].createInstance(Components.interfaces.nsIMsgDBView);

  var isNews = isNewsURI(msgFolder.URI);
  if (!viewFlags) {
    if (isNews) {
      // news defaults to threaded mode
      viewFlags = nsMsgViewFlagsType.kThreadedDisplay;
    }
  }

  if (!sortType) {
    if (isNews) {
      // news defaults to threaded mode
      sortType = nsMsgViewSortType.byThread;
    }
    else {
      sortType = nsMsgViewSortType.byDate;
    }
  }

  if (!sortOrder) {
    sortOrder = nsMsgViewSortOrder.ascending;
  }

  gCurViewFlags = viewFlags;
  var count = new Object;
  if (!gThreadPaneCommandUpdater)
    gThreadPaneCommandUpdater = new nsMsgDBViewCommandUpdater();

  if ((sortType == nsMsgViewSortType.byAuthor) && IsSpecialFolder(msgFolder, MSG_FOLDER_FLAG_SENTMAIL | MSG_FOLDER_FLAG_DRAFTS | MSG_FOLDER_FLAG_QUEUE)) {
    gCurSortType = nsMsgViewSortType.byRecipient;
  }
  else {
    gCurSortType = sortType;
  }

  gDBView.init(messenger, msgWindow, gThreadPaneCommandUpdater);
  gDBView.open(msgFolder, gCurSortType, sortOrder, viewFlags, count);
}

function CreateDBView(msgFolder, viewType, viewFlags, sortType, sortOrder)
{
  // call the inner create method
  CreateBareDBView(msgFolder, viewType, viewFlags, sortType, sortOrder);

  // now do outliner specific work

  // based on the collapsed state of the thread pane/message pane splitter,
  // supress message display if appropriate.
  gDBView.supressMsgDisplay = IsThreadAndMessagePaneSplitterCollapsed();

  UpdateSortIndicators(gCurSortType, sortOrder);
  PersistViewAttributesOnFolder();
}

function SetViewFlags(viewFlags)
{
    if (!gDBView) return;
    gDBView.viewFlags = viewFlags;
}

//------------------------------------------------------------
// Sets the column header sort icon based on the requested
// column and direction.
//
// Notes:
// (1) This function relies on the first part of the
//     <treecell id> matching the <treecol id>.  The treecell
//     id must have a "Header" suffix.
// (2) By changing the "sortDirection" attribute, a different
//     CSS style will be used, thus changing the icon based on
//     the "sortDirection" parameter.
//------------------------------------------------------------
function UpdateSortIndicator(column,sortDirection)
{
  // this is obsolete
}

function SortFolderPane(column, sortKey)
{
  var node = FindInSidebar(window, column);
  if(!node)
  {
    dump('Couldnt find sort column\n');
    return false;
  }
  SortColumn(node, sortKey, null, null);
  //Remove the sortActive attribute because we don't want this pane to have any
  //sort styles.
  node.setAttribute("sortActive", "false");
  return true;
}

function SortColumn(node, sortKey, secondarySortKey, direction)
{
	var xulSortService = Components.classes["@mozilla.org/xul/xul-sort-service;1"].getService();

  if (xulSortService)
  {
    xulSortService = xulSortService.QueryInterface(Components.interfaces.nsIXULSortService);
    if (xulSortService)
    {
      // sort!!!
      var sortDirection;
      if(direction)
        sortDirection = direction;
      else
      {
        var currentDirection = node.getAttribute('sortDirection');
        if (currentDirection == "ascending")
            sortDirection = "descending";
        else if (currentDirection == "descending")
            sortDirection = "ascending";
        else    sortDirection = "ascending";
      }

      try
      {
        if(secondarySortKey)
          node.setAttribute('resource2', secondarySortKey);
        xulSortService.Sort(node, sortKey, sortDirection);
      }
      catch(e)
      {
                    //dump("Sort failed: " + e + "\n");
      }
    }
  }

}

function GetSelectedFolderResource()
{
  var folderTree = GetFolderTree();
  var selectedFolderList = folderTree.selectedItems;
  var selectedFolder = selectedFolderList[0];
  var uri = selectedFolder.getAttribute('id');

	var folderResource = RDF.GetResource(uri);
	return folderResource;
}

function OnMouseUpThreadAndMessagePaneSplitter()
  {
  if (gDBView) {
    // the collapsed state is the state after we released the mouse 
    // so we take it as it is
    gDBView.supressMsgDisplay = IsThreadAndMessagePaneSplitterCollapsed();
  }
  }

function OnClickThreadAndMessagePaneSplitterGrippy()
  {
  if (gDBView) {
    // the collapsed state is the state when we clicked on the grippy
    // not when afterwards, so we need to reverse this value
    gDBView.supressMsgDisplay = !IsThreadAndMessagePaneSplitterCollapsed();
   }
}

function FolderPaneSelectionChange()
{
  var tree = GetFolderTree();
  if(tree)
  {
    var selArray = tree.selectedItems;
    if ( selArray && (selArray.length == 1) )
    {
      ChangeFolderByDOMNode(selArray[0]);
    }
    else
    {
      ClearThreadPane();
    }
  }

  if (!gAccountCentralLoaded)
    ClearMessagePane();
  if (gDisplayStartupPage)
  {
    loadStartPage();
    gDisplayStartupPage = false;
  }
}

function ClearThreadPane()
{
  if (gDBView) {
    gDBView.close();
    gDBView = null; 
  }
}

function OpenFolderTreeToFolder(folderURI)
{
	var tree = GetFolderTree();
	return OpenToFolder(tree, folderURI);
}

function OpenToFolder(item, folderURI)
{
	if(item.nodeType != Node.ELEMENT_NODE)
		return null;

  var uri = item.getAttribute('id');
  dump(uri);
  dump('\n');
  if(uri == folderURI)
  {
    dump('found folder: ' + uri);
    dump('\n');
    return item;
  }

  var children = item.childNodes;
  var length = children.length;
  var i;
  dump('folder ' + uri);
  dump('has ' + length);
  dump('children\n');
  for(i = 0; i < length; i++)
  {
    var child = children[i];
    var folder = OpenToFolder(child, folderURI);
    if(folder)
    {
      child.setAttribute('open', 'true');
      return folder;
    }
  }
  return null;
}

function IsSpecialFolder(msgFolder, flags)
{
    if (!msgFolder || ((msgFolder.flags & flags) == 0)) {
        return false;
    }
    else {
        return true;
    }
}

function SelectNextMessage(nextMessage)
{
    dump("XXX implement SelectNextMessage()\n");
}

function GetSelectTrashUri(folder)
{
    if (!folder) return null;
    var uri = folder.getAttribute('id');
    var resource = RDF.GetResource(uri);
    var msgFolder =
        resource.QueryInterface(Components.interfaces.nsIMsgFolder);
    if (msgFolder)
    {
        var rootFolder = msgFolder.rootFolder;
        var numFolder;
        var out = new Object();
        var trashFolder = rootFolder.getFoldersWithFlag(MSG_FOLDER_FLAG_TRASH, 1, out);
        numFolder = out.value;
        if (trashFolder) {
            return trashFolder.URI;
        }
    }
    return null;
}

function Undo()
{
    messenger.Undo(msgWindow);
}

function Redo()
{
    messenger.Redo(msgWindow);
}

function MsgToggleWorkOffline()
{
  var ioService = nsJSComponentManager.getServiceByID("{9ac9e770-18bc-11d3-9337-00104ba0fd40}", "nsIIOService");
  var broadcaster = document.getElementById("cmd_toggleWorkOffline");

  // this is just code for my testing purposes, and doesn't have the proper UI, as in the offline spec.
  // we could use the account manager, or add a new service, the offline manager.
  // what the heck, might as well bite the bullet and add a new service.
  offlineManager = Components.classes["@mozilla.org/messenger/offline-manager;1"].getService(Components.interfaces.nsIMsgOfflineManager);

  var bundle = srGetStrBundle("chrome://communicator/locale/utilityOverlay.properties");
  var offlineManager = Components.classes["@mozilla.org/messenger/offline-manager;1"].getService(Components.interfaces.nsIMsgOfflineManager);
  var args = {result: 0};

  messenger.SetWindow(window, msgWindow);

  if (!gPrefs) GetPrefsService();
  var prefSendUnsentMessages = gPrefs.GetIntPref("offline.send.unsent_messages");
  var prefDownloadMessages   = gPrefs.GetIntPref("offline.download.download_messages");

  // dump("prefSendUnsentMessages" + prefSendUnsentMessages + "\n");
  // dump("prefDownloadMessages" + prefDownloadMessages + "\n");

	if(ioService.offline && broadcaster)
	{
		// going online.
		switch(prefSendUnsentMessages)
		{	
			case 0:
			    window.openDialog("chrome://messenger/content/sendMsgs.xul", "Send Unsent Messages", 
							      "chrome,modal,titlebar,resizable=no", args);
			    if(args.result == 1) { 
				    ioService.offline = !ioService.offline;
				    broadcaster.removeAttribute("offline");
				    broadcaster.setAttribute("tooltiptext", bundle.GetStringFromName("onlineTooltip"));
				    broadcaster.setAttribute("label", bundle.GetStringFromName("gooffline"));
				    FillInTooltip(broadcaster);
				    // void goOnline (in boolean sendUnsentMessages, in boolean playbackOfflineImapOperations, in nsIMsgWindow aMsgWindow); 
    offlineManager.goOnline(true, true, msgWindow);
				    // dump("MsgToggleWorkOffline() : 1");
			    }
			    else if(args.result == 2) { 
				    ioService.offline = !ioService.offline;
				    broadcaster.removeAttribute("offline");
				    broadcaster.setAttribute("tooltiptext", bundle.GetStringFromName("onlineTooltip"));
				    broadcaster.setAttribute("label", bundle.GetStringFromName("gooffline"));
				    FillInTooltip(broadcaster);
				    offlineManager.goOnline(false, true, msgWindow);
				    // dump("MsgToggleWorkOffline() : 2");
			    }
			    else if(args.result == 3) { 
				    // dump("MsgToggleWorkOffline() : 3");
				    return;
			    }
			    break;
			case 1:
				ioService.offline = !ioService.offline;
				broadcaster.removeAttribute("offline");
				broadcaster.setAttribute("tooltiptext", bundle.GetStringFromName("onlineTooltip"));
				broadcaster.setAttribute("label", bundle.GetStringFromName("gooffline"));
				FillInTooltip(broadcaster);
				offlineManager.goOnline(true, true, msgWindow);
				// dump("MsgToggleWorkOffline() : 4");
				break;
			case 2:
				ioService.offline = !ioService.offline;
				broadcaster.removeAttribute("offline");
				broadcaster.setAttribute("tooltiptext", bundle.GetStringFromName("onlineTooltip"));
				broadcaster.setAttribute("label", bundle.GetStringFromName("gooffline"));
				FillInTooltip(broadcaster);
				offlineManager.goOnline(false, true, msgWindow);
				// dump("MsgToggleWorkOffline() : 5");
				break;
		}
	}
	else if(broadcaster)
	{
		// going offline
		switch(prefDownloadMessages)
		{	
		    case 0:
				window.openDialog("chrome://messenger/content/downloadMsgs.xul", "Download Messages", 
								  "chrome,modal,titlebar,resizable=no", args);
				if(args.result == 1) { 
					ioService.offline = !ioService.offline;
					broadcaster.setAttribute("offline", "true");
					broadcaster.setAttribute("tooltiptext", bundle.GetStringFromName("offlineTooltip"));
					broadcaster.setAttribute("label", bundle.GetStringFromName("goonline"));
					FillInTooltip(broadcaster);

					// download news, download mail, send unsent messages, go offline when done, msg window
					offlineManager.synchronizeForOffline(false, true, true, true, msgWindow);
					// dump("MsgToggleWorkOffline() : 6");

				}
				else if(args.result == 2) { 
					ioService.offline = !ioService.offline;
					broadcaster.setAttribute("offline", "true");
					broadcaster.setAttribute("tooltiptext", bundle.GetStringFromName("offlineTooltip"));
					broadcaster.setAttribute("label", bundle.GetStringFromName("goonline"));
					FillInTooltip(broadcaster);

					// download news, download mail, send unsent messages, go offline when done, msg window
					offlineManager.synchronizeForOffline(false, false, true, true, msgWindow);
					// dump("MsgToggleWorkOffline() : 7");

				}
				else if(args.result == 3) { 
					
					return; 
				}
				break;
		    case 1:
				ioService.offline = !ioService.offline;
				broadcaster.setAttribute("offline", "true");
				broadcaster.setAttribute("tooltiptext", bundle.GetStringFromName("offlineTooltip"));
				broadcaster.setAttribute("label", bundle.GetStringFromName("goonline"));
				FillInTooltip(broadcaster);

				// download news, download mail, send unsent messages, go offline when done, msg window
				offlineManager.synchronizeForOffline(false, true, true, true, msgWindow);
				// dump("MsgToggleWorkOffline() : 8");

				break;
		    case 2:
				ioService.offline = !ioService.offline;
				broadcaster.setAttribute("offline", "true");
				broadcaster.setAttribute("tooltiptext", bundle.GetStringFromName("offlineTooltip"));
				broadcaster.setAttribute("label", bundle.GetStringFromName("goonline"));
				FillInTooltip(broadcaster);

				// download news, download mail, send unsent messages, go offline when done, msg window
				offlineManager.synchronizeForOffline(false, false, true, true, msgWindow);
				// dump("MsgToggleWorkOffline() : 9");
				break;
		}
	}
  }


function MsgDownloadFlagged()
  {
  // this is just code for my testing purposes, and doesn't have the proper UI, as in the offline spec.
  // we could use the account manager, or add a new service, the offline manager.
  // what the heck, might as well bite the bullet and add a new service.
  var offlineManager = Components.classes["@mozilla.org/messenger/offline-manager;1"].getService(Components.interfaces.nsIMsgOfflineManager);
  if (offlineManager) {
    // should use progress window here. params are:
    // download news, download mail, send unsent messages, go offline when done, msg window
    messenger.SetWindow(window, msgWindow);
    offlineManager.synchronizeForOffline(false, true, true, false, msgWindow);
  }
}

function MsgDownloadSelected()
{
  // this is just code for my testing purposes, and doesn't have the proper UI, as in the offline spec.
  // we could use the account manager, or add a new service, the offline manager.
  // what the heck, might as well bite the bullet and add a new service.
  var offlineManager = Components.classes["@mozilla.org/messenger/offline-manager;1"].getService(Components.interfaces.nsIMsgOfflineManager);
  if (offlineManager) {
    // should use progress window here. params are:
    // download news, download mail, send unsent messages, go offline when done, msg window
    messenger.SetWindow(window, msgWindow);
    offlineManager.synchronizeForOffline(false, true, true, false, msgWindow);
  }
  }

function MsgSettingsOffline()
{
}

function GetPrefsService()
{
   // Store the prefs object
   try {
        var prefsService = Components.classes["@mozilla.org/preferences;1"];
        if (prefsService)
        prefsService = prefsService.getService();
        if (prefsService)
        gPrefs = prefsService.QueryInterface(Components.interfaces.nsIPref);

        if (!gPrefs)
        dump("failed to get prefs service!\n");
   }
   catch(ex) {
        dump("failed to get prefs service!\n");
   }
}

