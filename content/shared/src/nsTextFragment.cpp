/* -*- Mode: C++; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*-
 *
 * The contents of this file are subject to the Netscape Public License
 * Version 1.0 (the "License"); you may not use this file except in
 * compliance with the License.  You may obtain a copy of the License at
 * http://www.mozilla.org/NPL/
 *
 * Software distributed under the License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied.  See
 * the License for the specific language governing rights and limitations
 * under the License.
 *
 * The Original Code is Mozilla Communicator client code.
 *
 * The Initial Developer of the Original Code is Netscape Communications
 * Corporation.  Portions created by Netscape are Copyright (C) 1998
 * Netscape Communications Corporation.  All Rights Reserved.
 */
#include "nsTextFragment.h"
#include "nsString.h"
#include "nsCRT.h"

nsTextFragment::~nsTextFragment()
{
  ReleaseText();
}

void
nsTextFragment::ReleaseText()
{
  if (mLength && m1b && mInHeap) {
    if (mIs2b) {
      delete [] m2b;
    }
    else {
      delete [] m1b;
    }
  }
  m1b = nsnull;
  mIs2b = 0;
  mInHeap = 0;
  mLength = 0;
}

nsTextFragment::nsTextFragment(const nsTextFragment& aOther)
{
  if (aOther.Is2b()) {
    SetTo(aOther.Get2b(), aOther.GetLength());
  }
  else {
    SetTo(aOther.Get1b(), aOther.GetLength());
  }
}

nsTextFragment::nsTextFragment(const char* aString)
{
  SetTo(aString, strlen(aString));
}

nsTextFragment::nsTextFragment(const PRUnichar* aString)
{
  SetTo(aString, nsCRT::strlen(aString));
}

nsTextFragment::nsTextFragment(const nsString& aString)
{
  SetTo(aString.GetUnicode(), aString.Length());
}

nsTextFragment&
nsTextFragment::operator=(const nsTextFragment& aOther)
{
  if (aOther.Is2b()) {
    SetTo(aOther.Get2b(), aOther.GetLength());
  }
  else {
    SetTo(aOther.Get1b(), aOther.GetLength());
  }
  return *this;
}

nsTextFragment&
nsTextFragment::operator=(const char* aString)
{
  SetTo(aString, nsCRT::strlen(aString));
  return *this;
}

nsTextFragment&
nsTextFragment::operator=(const PRUnichar* aString)
{
  SetTo(aString, nsCRT::strlen(aString));
  return *this;
}

nsTextFragment&
nsTextFragment::operator=(const nsString& aString)
{
  SetTo(aString.GetUnicode(), aString.Length());
  return *this;
}

void
nsTextFragment::SetTo(PRUnichar* aBuffer, PRInt32 aLength, PRBool aRelease)
{
  ReleaseText();

  m2b = aBuffer;
  mIs2b = 1;
  mInHeap = aRelease ? 1 : 0;
  mLength = aLength;
}

void
nsTextFragment::SetTo(const PRUnichar* aBuffer, PRInt32 aLength)
{
  ReleaseText();
  if (0 != aLength) {
    // See if we need to store the data in ucs2 or not
    PRBool need2 = PR_FALSE;
    const PRUnichar* cp = aBuffer;
    const PRUnichar* end = aBuffer + aLength;
    while (cp < end) {
      PRUnichar ch = *cp++;
      if (ch >> 8) {
        need2 = PR_TRUE;
        break;
      }
    }

    if (need2) {
      // Use ucs2 storage because we have to
      PRUnichar* nt = new PRUnichar[aLength];
      if (nsnull != nt) {
        // Copy data
        nsCRT::memcpy(nt, aBuffer, sizeof(PRUnichar) * aLength);

        // Setup our fields
        m2b = nt;
        mIs2b = 1;
        mInHeap = 1;
        mLength = aLength;
      }
    }
    else {
      // Use 1 byte storage because we can
      unsigned char* nt = new unsigned char[aLength];
      if (nsnull != nt) {
        // Copy data
        unsigned char* cp = nt;
        unsigned char* end = nt + aLength;
        while (cp < end) {
          *cp++ = (unsigned char) *aBuffer++;
        }

        // Setup our fields
        m1b = nt;
        mIs2b = 0;
        mInHeap = 1;
        mLength = aLength;
      }
    }
  }
}

void
nsTextFragment::SetTo(const char* aBuffer, PRInt32 aLength)
{
  ReleaseText();
  if (0 != aLength) {
    unsigned char* nt = new unsigned char[aLength];
    if (nsnull != nt) {
      nsCRT::memcpy(nt, aBuffer, sizeof(unsigned char) * aLength);

      m1b = nt;
      mIs2b = 0;
      mInHeap = 1;
      mLength = aLength;
    }
  }
}

void
nsTextFragment::AppendTo(nsString& aString) const
{
  if (mIs2b) {
    aString.Append(m2b, mLength);
  }
  else {
    aString.Append((char*)m1b, mLength);
  }
}

void
nsTextFragment::CopyTo(PRUnichar* aDest, PRInt32 aOffset, PRInt32 aCount)
{
  if (aOffset < 0) aOffset = 0;
  if (aOffset + aCount > GetLength()) {
    aCount = mLength - aOffset;
  }
  if (0 != aCount) {
    if (mIs2b) {
      nsCRT::memcpy(aDest, m2b + aOffset, sizeof(PRUnichar) * aCount);
    }
    else {
      unsigned char* cp = m1b + aOffset;
      unsigned char* end = cp + aCount;
      while (cp < end) {
        *aDest++ = PRUnichar(*cp++);
      }
    }
  }
}

void
nsTextFragment::CopyTo(char* aDest, PRInt32 aOffset, PRInt32 aCount)
{
  if (aOffset < 0) aOffset = 0;
  if (aOffset + aCount > GetLength()) {
    aCount = mLength - aOffset;
  }
  if (0 != aCount) {
    if (mIs2b) {
      PRUnichar* cp = m2b + aOffset;
      PRUnichar* end = cp + aCount;
      while (cp < end) {
        *aDest++ = (unsigned char) (*cp++);
      }
    }
    else {
      nsCRT::memcpy(aDest, m1b + aOffset, sizeof(char) * aCount);
    }
  }
}
