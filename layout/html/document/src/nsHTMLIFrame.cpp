/* -*- Mode: C++; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*-
 *
 * The contents of this file are subject to the Netscape Public License
 * Version 1.0 (the "NPL"); you may not use this file except in
 * compliance with the NPL.  You may obtain a copy of the NPL at
 * http://www.mozilla.org/NPL/
 *
 * Software distributed under the NPL is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the NPL
 * for the specific language governing rights and limitations under the
 * NPL.
 *
 * The Initial Developer of this code under the NPL is Netscape
 * Communications Corporation.  Portions created by Netscape are
 * Copyright (C) 1998 Netscape Communications Corporation.  All Rights
 * Reserved.
 */

#include "nsHTMLContainer.h"
#include "nsLeafFrame.h"
#include "nsIWebWidget.h"
#include "nsIPresContext.h"
#include "nsIPresShell.h"
#include "nsHTMLIIDs.h"
#include "nsRepository.h"
#include "nsIStreamListener.h"
#include "nsIURL.h"
#include "nsIDocument.h"
#include "nsIWebFrame.h"
#include "nsIView.h"
#include "nsIViewManager.h"
#include "nsWidgetsCID.h"
#include "nsViewsCID.h"
#include "nsHTMLAtoms.h"
#include "nsIScrollableView.h"

#include "nsIDocumentLoader.h"

static NS_DEFINE_IID(kIStreamObserverIID, NS_ISTREAMOBSERVER_IID);
static NS_DEFINE_IID(kISupportsIID, NS_ISUPPORTS_IID);
static NS_DEFINE_IID(kIWebWidgetIID, NS_IWEBWIDGET_IID);
static NS_DEFINE_IID(kIWebFrameIID, NS_IWEBFRAME_IID);
static NS_DEFINE_IID(kCWebWidgetCID, NS_WEBWIDGET_CID);
static NS_DEFINE_IID(kIViewIID, NS_IVIEW_IID);
static NS_DEFINE_IID(kCViewCID, NS_VIEW_CID);
static NS_DEFINE_IID(kCChildCID, NS_CHILD_CID);
static NS_DEFINE_IID(kCDocumentLoaderCID, NS_DOCUMENTLOADER_CID);

static NS_DEFINE_IID(kIViewerContainerIID, NS_IVIEWERCONTAINER_IID);
static NS_DEFINE_IID(kIDocumentLoaderIID, NS_IDOCUMENTLOADER_IID);

// XXX temporary until doc manager/loader is in place
class TempObserver : public nsIStreamObserver
{
public:
  TempObserver() { NS_INIT_REFCNT(); }

  ~TempObserver() {}
  // nsISupports
  NS_DECL_ISUPPORTS

  // nsIStreamObserver
  NS_IMETHOD OnProgress(PRInt32 aProgress, PRInt32 aProgressMax,
                        const nsString& aMsg);
  NS_IMETHOD OnStartBinding(const char *aContentType);
  NS_IMETHOD OnStopBinding(PRInt32 status, const nsString& aMsg);

protected:

  nsString mURL;
  nsString mOverURL;
  nsString mOverTarget;
};

class FrameLoadingInfo : public nsISupports
{
public:
  FrameLoadingInfo(const nsSize& aSize);

  // nsISupports interface...
  NS_DECL_ISUPPORTS

protected:
  virtual ~FrameLoadingInfo() {}

public:
  nsSize mFrameSize;
};


class nsHTMLIFrameFrame : public nsLeafFrame, public nsIWebFrame, public nsIViewerContainer {

public:

  nsHTMLIFrameFrame(nsIContent* aContent, nsIFrame* aParentFrame);

  /**
    * @see nsIFrame::Paint
    */
  NS_IMETHOD Paint(nsIPresContext& aPresContext,
                   nsIRenderingContext& aRenderingContext,
                   const nsRect& aDirtyRect);

  /**
    * @see nsIFrame::Reflow
    */
  NS_IMETHOD Reflow(nsIPresContext*      aCX,
                    nsReflowMetrics&     aDesiredSize,
                    const nsReflowState& aReflowState,
                    nsReflowStatus&      aStatus);

  NS_IMETHOD MoveTo(nscoord aX, nscoord aY);
  NS_IMETHOD SizeTo(nscoord aWidth, nscoord aHeight);

  /* nsIViewerContainer interface */
  NS_IMETHOD Embed(nsIDocumentWidget* aDocViewer, 
                   const char* aCommand,
                   nsISupports* aExtraInfo);


  virtual nsIWebWidget* GetWebWidget();

  float GetTwipsToPixels();

  NS_DECL_ISUPPORTS

protected:

  virtual ~nsHTMLIFrameFrame();

  virtual void GetDesiredSize(nsIPresContext* aPresContext,
                              const nsReflowState& aReflowState,
                              nsReflowMetrics& aDesiredSize);

  nsIWebWidget* mWebWidget;
  nsIDocumentLoader* mDocLoader;
  PRBool mCreatingViewer;

  // XXX fix these
  TempObserver* mTempObserver;
};

class nsHTMLIFrame : public nsHTMLContainer {
public:
 
  virtual nsresult  CreateFrame(nsIPresContext*  aPresContext,
                                nsIFrame*        aParentFrame,
                                nsIStyleContext* aStyleContext,
                                nsIFrame*&       aResult);

  void GetSize(float aPixelsToTwips, nsSize& aSize);
  PRBool GetURL(nsString& aURLSpec);
  PRBool GetName(nsString& aName);
  nsScrollPreference GetScrolling();

#if 0
  virtual nsContentAttr GetAttribute(nsIAtom* aAttribute,
                                     nsHTMLValue& aValue) const;

  virtual void SetAttribute(nsIAtom* aAttribute, const nsString& aValue);
#endif

protected:
  nsHTMLIFrame(nsIAtom* aTag, nsIWebWidget* aParentWebWidget);
  virtual  ~nsHTMLIFrame();

  // this is held for a short time until the frame uses it, so it is not ref counted
  nsIWebWidget* mParentWebWidget;  

  friend nsresult NS_NewHTMLIFrame(nsIHTMLContent** aInstancePtrResult,
                                   nsIAtom* aTag, nsIWebWidget* aWebWidget);
  friend class nsHTMLIFrameFrame;

};

// nsHTMLIFrameFrame

nsHTMLIFrameFrame::nsHTMLIFrameFrame(nsIContent* aContent, nsIFrame* aParentFrame)
  : nsLeafFrame(aContent, aParentFrame)
{
  NS_INIT_REFCNT();

  // Addref this frame because it supports interfaces which require ref-counting!
  NS_ADDREF(this);
  
  mWebWidget = nsnull;
  mCreatingViewer = PR_FALSE;
  mTempObserver = new TempObserver();
  NS_ADDREF(mTempObserver);

  NSRepository::CreateInstance(kCDocumentLoaderCID, nsnull, kIDocumentLoaderIID, (void**)&mDocLoader);
}

nsHTMLIFrameFrame::~nsHTMLIFrameFrame()
{
  NS_IF_RELEASE(mWebWidget);
  NS_IF_RELEASE(mDocLoader);
  NS_RELEASE(mTempObserver);
}

NS_IMPL_ADDREF(nsHTMLIFrameFrame);
NS_IMPL_RELEASE(nsHTMLIFrameFrame);

nsresult
nsHTMLIFrameFrame::QueryInterface(const nsIID& aIID,
                                 void** aInstancePtrResult)
{
  NS_PRECONDITION(nsnull != aInstancePtrResult, "null pointer");
  if (nsnull == aInstancePtrResult) {
    return NS_ERROR_NULL_POINTER;
  }
  if (aIID.Equals(kIWebFrameIID)) {
    *aInstancePtrResult = (void*) ((nsIWebFrame*)this);
    AddRef();
    return NS_OK;
  }
  if (aIID.Equals(kIViewerContainerIID)) {
    *aInstancePtrResult = (void*) ((nsIViewerContainer*)this);
    AddRef();
    return NS_OK;
  }
  if (aIID.Equals(kISupportsIID)) {
    *aInstancePtrResult = (void*) ((nsISupports*)((nsIWebFrame*)this));
    AddRef();
    return NS_OK;
  }
  return nsLeafFrame::QueryInterface(aIID, aInstancePtrResult);
}

nsIWebWidget* nsHTMLIFrameFrame::GetWebWidget()
{
  NS_IF_ADDREF(mWebWidget);
  return mWebWidget;
}

float nsHTMLIFrameFrame::GetTwipsToPixels()
{
  nsISupports* parentSup;
  if (mWebWidget) {
    mWebWidget->GetContainer(&parentSup);
    if (parentSup) {
      nsIWebWidget* parentWidget;
      nsresult res = parentSup->QueryInterface(kIWebWidgetIID, (void**)&parentWidget);
      if (NS_OK == res) {
        nsIPresContext* presContext = parentWidget->GetPresContext();
        NS_RELEASE(parentWidget);
        if (presContext) {
          float ret = presContext->GetTwipsToPixels();
          NS_RELEASE(presContext);
          return ret;
        } 
      } else {
        NS_ASSERTION(0, "invalid web widget container");
      }
    } else {
      NS_ASSERTION(0, "invalid web widget container");
    }
  }
  return (float)0.05;  // this should not be reached
}


NS_METHOD
nsHTMLIFrameFrame::MoveTo(nscoord aX, nscoord aY)
{
  return nsLeafFrame::MoveTo(aX, aY);
}

NS_METHOD
nsHTMLIFrameFrame::SizeTo(nscoord aWidth, nscoord aHeight)
{
  return nsLeafFrame::SizeTo(aWidth, aWidth);
}

NS_IMETHODIMP
nsHTMLIFrameFrame::Paint(nsIPresContext& aPresContext,
                         nsIRenderingContext& aRenderingContext,
                         const nsRect& aDirtyRect)
{
  if (nsnull != mWebWidget) {
    mWebWidget->Show();
  }
  return NS_OK;
}


void TempMakeAbsURL(nsIContent* aContent, nsString& aRelURL, nsString& aAbsURL)
{
  nsIURL* docURL = nsnull;
  nsIDocument* doc = nsnull;
  aContent->GetDocument(doc);
  if (nsnull != doc) {
    docURL = doc->GetDocumentURL();
    NS_RELEASE(doc);
  }

  nsAutoString base;
  nsresult rv = NS_MakeAbsoluteURL(docURL, base, aRelURL, aAbsURL);
  NS_IF_RELEASE(docURL);
}

NS_IMETHODIMP
nsHTMLIFrameFrame::Embed(nsIDocumentWidget* aDocViewer, 
                         const char* aCommand,
                         nsISupports* aExtraInfo)
{
  nsresult rv;
  nsIWebWidget* ww;
  nsHTMLIFrame* content = (nsHTMLIFrame*)mContent;

  if (nsnull != mWebWidget) {
    mWebWidget->SetLinkHandler(nsnull);
    mWebWidget->SetContainer(nsnull); // release the doc observer
    NS_RELEASE(mWebWidget);
  }

  rv = aDocViewer->QueryInterface(kIWebWidgetIID, (void**)&ww);
  if (NS_OK != rv) {
    NS_ASSERTION(0, "could not create web widget");
    return rv;
  }

  FrameLoadingInfo *frameInfo;
  frameInfo = (FrameLoadingInfo*) aExtraInfo;

  nsString frameName;
  if (content->GetName(frameName)) {
    ww->SetName(frameName);
  }

  // set the web widget parentage
  nsIWebWidget* parentWebWidget = content->mParentWebWidget;
  parentWebWidget->AddChild(ww);


  // Get the view manager, conversion
  float t2p = 0.0f;
  nsIViewManager* viewMan = nsnull;

  nsIPresContext* presContext = parentWebWidget->GetPresContext();
  t2p = presContext->GetTwipsToPixels();
  nsIPresShell *presShell = presContext->GetShell();     
	viewMan = presShell->GetViewManager();  
  NS_RELEASE(presShell);
  NS_RELEASE(presContext);
  //NS_RELEASE(parentWebWidget);


  // create, init, set the parent of the view
  nsIView* view;
  rv = NSRepository::CreateInstance(kCViewCID, nsnull, kIViewIID,
                                        (void **)&view);
  if (NS_OK != rv) {
    NS_ASSERTION(0, "Could not create view for nsHTMLIFrame"); 
    return rv;
  }

  nsIView* parView;
  nsPoint origin;
  nsSize aSize = frameInfo->mFrameSize;
  GetOffsetFromView(origin, parView);  
  nsRect viewBounds(origin.x, origin.y, aSize.width, aSize.height);

  rv = view->Init(viewMan, viewBounds, parView, &kCChildCID);
  viewMan->InsertChild(parView, view, 0);
  NS_RELEASE(viewMan);
  SetView(view);
  NS_RELEASE(parView);

  // init the web widget
  mWebWidget = ww;
  nsIWidget* widget = view->GetWidget();
  NS_RELEASE(view);
  nsRect webBounds(0, 0, NS_TO_INT_ROUND(aSize.width * t2p), 
                   NS_TO_INT_ROUND(aSize.height * t2p));
  mWebWidget->Init(widget->GetNativeData(NS_NATIVE_WIDGET), webBounds, 
                   content->GetScrolling());
  NS_RELEASE(widget);

  mWebWidget->Show();
  mCreatingViewer = PR_FALSE;

  return NS_OK;
}



NS_IMETHODIMP
nsHTMLIFrameFrame::Reflow(nsIPresContext*      aPresContext,
                          nsReflowMetrics&     aDesiredSize,
                          const nsReflowState& aReflowState,
                          nsReflowStatus&      aStatus)
{
  nsresult rv = NS_OK;

  // Always get the size so that the caller knows how big we are
  GetDesiredSize(aPresContext, aReflowState, aDesiredSize);

  if ((nsnull == mWebWidget) && (!mCreatingViewer)) {
    FrameLoadingInfo *frameInfo;

    nsHTMLIFrame* content = (nsHTMLIFrame*)mContent;
    nsAutoString url;
    content->GetURL(url);
    nsSize size;

    size.SizeTo(aDesiredSize.width, aDesiredSize.height);

    frameInfo = new FrameLoadingInfo(size);
    NS_ADDREF(frameInfo);

    if (nsnull != mDocLoader) {
      mCreatingViewer=PR_TRUE;

      // load the document
      nsString absURL;
      TempMakeAbsURL(mContent, url, absURL);

      rv = mDocLoader->LoadURL(absURL,          // URL string
                               nsnull,          // Command
                               this,            // Container
                               nsnull,          // Post Data
                               frameInfo,       // Extra Info...
                               mTempObserver);  // Observer
    }
    NS_RELEASE(frameInfo);
  }
  aStatus = NS_FRAME_COMPLETE;
  return rv;
}

void 
nsHTMLIFrameFrame::GetDesiredSize(nsIPresContext* aPresContext,
                                  const nsReflowState& aReflowState,
                                  nsReflowMetrics& aDesiredSize)
{
  nsSize size;
  ((nsHTMLIFrame*)mContent)->GetSize(aPresContext->GetPixelsToTwips(), size);
  aDesiredSize.width  = size.width;
  aDesiredSize.height = size.height;
  aDesiredSize.ascent = aDesiredSize.height;
  aDesiredSize.descent = 0;
}

// nsHTMLIFrame

nsHTMLIFrame::nsHTMLIFrame(nsIAtom* aTag, nsIWebWidget* aParentWebWidget)
  : nsHTMLContainer(aTag), mParentWebWidget(aParentWebWidget)
{
}

nsHTMLIFrame::~nsHTMLIFrame()
{
  mParentWebWidget = nsnull;
}

nsresult
nsHTMLIFrame::CreateFrame(nsIPresContext*  aPresContext,
                          nsIFrame*        aParentFrame,
                          nsIStyleContext* aStyleContext,
                          nsIFrame*&       aResult)
{
  nsIFrame* frame = new nsHTMLIFrameFrame(this, aParentFrame);
  if (nsnull == frame) {
    return NS_ERROR_OUT_OF_MEMORY;
  }
  aResult = frame;
  frame->SetStyleContext(aPresContext, aStyleContext);
  return NS_OK;
}

void nsHTMLIFrame::GetSize(float aPixelsToTwips, nsSize& aSize)
{
  aSize.width  = 200;
  aSize.height = 200;

  PRInt32 status;
  nsHTMLValue  htmlVal;
  nsAutoString stringVal;
  PRInt32 intVal;

  if (eContentAttr_HasValue == (GetAttribute(nsHTMLAtoms::width, htmlVal))) {
    if (eHTMLUnit_String == htmlVal.GetUnit()) {
      htmlVal.GetStringValue(stringVal);
      intVal = stringVal.ToInteger(&status);
      if (NS_OK == status) {
        aSize.width = intVal;
      }
    }
  }
  if (eContentAttr_HasValue == (GetAttribute(nsHTMLAtoms::height, htmlVal))) {
    if (eHTMLUnit_String == htmlVal.GetUnit()) {
      htmlVal.GetStringValue(stringVal);
      intVal = stringVal.ToInteger(&status);
      if (NS_OK == status) {
        aSize.height = intVal;
      }
    }
  }

  aSize.width  = (nscoord)(aSize.width * aPixelsToTwips + 0.5);
  aSize.height = (nscoord)(aSize.height * aPixelsToTwips + 0.5);
}

PRBool nsHTMLIFrame::GetURL(nsString& aURLSpec)
{
  nsHTMLValue value;
  if (eContentAttr_HasValue == (GetAttribute(nsHTMLAtoms::src, value))) {
    if (eHTMLUnit_String == value.GetUnit()) {
      value.GetStringValue(aURLSpec);
      return PR_TRUE;
    }
  }
  aURLSpec.SetLength(0);
  return PR_FALSE;
}

PRBool nsHTMLIFrame::GetName(nsString& aName)
{
  nsHTMLValue value;
  if (eContentAttr_HasValue == (GetAttribute(nsHTMLAtoms::name, value))) {
    if (eHTMLUnit_String == value.GetUnit()) {
      value.GetStringValue(aName);
      return PR_TRUE;
    }
  }
  aName.SetLength(0);
  return PR_FALSE;
}

nsScrollPreference nsHTMLIFrame::GetScrolling()
{
  nsHTMLValue value;
  if (eContentAttr_HasValue == (GetAttribute(nsHTMLAtoms::scrolling, value))) {
    if (eHTMLUnit_String == value.GetUnit()) {
      nsAutoString scrolling;
      value.GetStringValue(scrolling);
      if (scrolling.EqualsIgnoreCase("yes")) {
        return nsScrollPreference_kAlwaysScroll;
      } 
      else if (scrolling.EqualsIgnoreCase("no")) {
        return nsScrollPreference_kNeverScroll;
      }
    }
  }
  return nsScrollPreference_kAuto;
}

nsresult
NS_NewHTMLIFrame(nsIHTMLContent** aInstancePtrResult,
                 nsIAtom* aTag, nsIWebWidget* aWebWidget)
{
  NS_PRECONDITION(nsnull != aInstancePtrResult, "null ptr");
  if (nsnull == aInstancePtrResult) {
    return NS_ERROR_NULL_POINTER;
  }

  nsIHTMLContent* it = new nsHTMLIFrame(aTag, aWebWidget);

  if (nsnull == it) {
    return NS_ERROR_OUT_OF_MEMORY;
  }
  return it->QueryInterface(kIHTMLContentIID, (void**) aInstancePtrResult);
}






FrameLoadingInfo::FrameLoadingInfo(const nsSize& aSize)
{
  NS_INIT_REFCNT();

  mFrameSize = aSize;
}

/*
 * Implementation of ISupports methods...
 */
NS_IMPL_ISUPPORTS(FrameLoadingInfo,kISupportsIID);




// XXX temp implementation

NS_IMPL_ADDREF(TempObserver);
NS_IMPL_RELEASE(TempObserver);

nsresult
TempObserver::QueryInterface(const nsIID& aIID,
                            void** aInstancePtrResult)
{
  NS_PRECONDITION(nsnull != aInstancePtrResult, "null pointer");
  if (nsnull == aInstancePtrResult) {
    return NS_ERROR_NULL_POINTER;
  }
  if (aIID.Equals(kIStreamObserverIID)) {
    *aInstancePtrResult = (void*) ((nsIStreamObserver*)this);
    AddRef();
    return NS_OK;
  }
  if (aIID.Equals(kISupportsIID)) {
    *aInstancePtrResult = (void*) ((nsISupports*)((nsIDocumentObserver*)this));
    AddRef();
    return NS_OK;
  }
  return NS_NOINTERFACE;
}


NS_IMETHODIMP
TempObserver::OnProgress(PRInt32 aProgress, PRInt32 aProgressMax,
                        const nsString& aMsg)
{
  fputs("[progress ", stdout);
  fputs(mURL, stdout);
  printf(" %d %d ", aProgress, aProgressMax);
  fputs(aMsg, stdout);
  fputs("]\n", stdout);
  return NS_OK;
}

NS_IMETHODIMP
TempObserver::OnStartBinding(const char *aContentType)
{
  fputs("Loading ", stdout);
  fputs(mURL, stdout);
  fputs("\n", stdout);
  return NS_OK;
}

NS_IMETHODIMP
TempObserver::OnStopBinding(PRInt32 status, const nsString& aMsg)
{
  fputs("Done loading ", stdout);
  fputs(mURL, stdout);
  fputs("\n", stdout);
  return NS_OK;
}


