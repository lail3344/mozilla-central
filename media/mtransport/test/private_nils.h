/* -*- Mode: C++; tab-width: 8; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* vim: set ts=2 et sw=2 tw=80: */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

#ifndef private_nils_h__
#define private_nils_h__

#define MOZILLA_STRICT_API

#include "mozilla/ModuleUtils.h"
#include "nsIFactory.h"
#include "nsIComponentRegistrar.h"
#include "nsINetworkManager.h"
#include "nsINetworkInterfaceListService.h"

#include "nsEmbedString.h"

/* {ba96215e-b279-43ff-b10c-6f88f15da63b} */
#define LIST_CID \
  {0xba96215e, 0xb279, 0x43ff, \
    { 0xb1, 0x0c, 0x6f, 0x88, 0xf1, 0x5d, 0xa6, 0x3b }}

#define LIST_CONTRACTID "@mozilla.org/network/interface-list;1"

/* {3780be6e-7012-4e53-ade6-15212fb88a0d} (copied from NetworkInterfaceListService.js) */
#define SERVICE_CID \
  {0x3780be6e, 0x7012, 0x4e53, \
    { 0xad, 0xe6, 0x15, 0x21, 0x2f, 0xb8, 0x8a, 0x0d }}

#define SERVICE_CONTRACTID \
  "@mozilla.org/network/interface-list-service;1"

#define INTERFACE_CONTRACTID "@mozilla.org/network/interface;1"

#include <unistd.h>
#include <sys/param.h>
#include <sys/socket.h>
#ifndef ANDROID
#include <sys/sysctl.h>
#include <sys/syslog.h>
#else
#include <syslog.h>
/* Work around an Android NDK < r8c bug */
#undef __unused
#include <linux/sysctl.h>
#endif
#include <net/if.h>
#ifndef LINUX
#include <net/if_var.h>
#include <net/if_dl.h>
#include <net/if_types.h>
#include <sys/sockio.h>
#else
#include <linux/if.h>
#endif
#include <net/route.h>

/* IP */
#include <netinet/in.h>
#ifdef LINUX
#include "sys/ioctl.h"
#else
#include <netinet/in_var.h>
#endif
#include <arpa/inet.h>
#include <netdb.h>

/* Code template from nsINetworkInterfaceListService.h & nsINetworkManager.h */

/* Header: nsINetworkInterface */
class PrivateNetworkInterface : public nsINetworkInterface
{
public:
  NS_DECL_ISUPPORTS
  NS_DECL_NSINETWORKINTERFACE

  PrivateNetworkInterface(const char* aIp, const char* aName):mIp(aIp), mName(aName) {}

private:
  ~PrivateNetworkInterface() {}

  nsEmbedCString mIp;
  nsEmbedCString mName;
};

/* Header: nsINetworkInterfaceList */
class PrivateNetworkInterfaceList : public nsINetworkInterfaceList
{
public:
  NS_DECL_ISUPPORTS

  NS_DECL_NSINETWORKINTERFACELIST

  PrivateNetworkInterfaceList()
  {
    nsresult rv;
    mInterfaces.Clear();
    rv = PopulateInterfaces();
    if (!NS_SUCCEEDED(rv)) {
      mInterfaces.Clear();
      return;
    }
  }

private:
  ~PrivateNetworkInterfaceList() {}

  NS_IMETHOD PopulateInterfaces();

  nsCOMArray<nsINetworkInterface> mInterfaces;
};

/* Header: nsINetworkInterfaceListService */
class PrivateNetworkInterfaceListService : public nsINetworkInterfaceListService
{
public:
  NS_DECL_ISUPPORTS
  NS_DECL_NSINETWORKINTERFACELISTSERVICE

  PrivateNetworkInterfaceListService() {}

private:
  ~PrivateNetworkInterfaceListService() {}

};

/* Implementation: nsINetworkInterface */

NS_IMPL_ISUPPORTS1(PrivateNetworkInterface, nsINetworkInterface)

/* readonly attribute long state; */
NS_IMETHODIMP PrivateNetworkInterface::GetState(int32_t *aState)
{
  return NS_ERROR_NOT_IMPLEMENTED;
}

/* readonly attribute long type; */
NS_IMETHODIMP PrivateNetworkInterface::GetType(int32_t *aType)
{
  return NS_ERROR_NOT_IMPLEMENTED;
}

/* readonly attribute DOMString name; */
NS_IMETHODIMP PrivateNetworkInterface::GetName(nsAString & aName)
{
  aName = NS_ConvertUTF8toUTF16(mName);
  return NS_OK;
}

/* readonly attribute DOMString ip; */
NS_IMETHODIMP PrivateNetworkInterface::GetIp(nsAString & aIp)
{
  aIp = NS_ConvertUTF8toUTF16(mIp);
  return NS_OK;
}

/* readonly attribute DOMString netmask; */
NS_IMETHODIMP PrivateNetworkInterface::GetNetmask(nsAString & aNetmask)
{
  return NS_ERROR_NOT_IMPLEMENTED;
}

/* readonly attribute DOMString broadcast; */
NS_IMETHODIMP PrivateNetworkInterface::GetBroadcast(nsAString & aBroadcast)
{
  return NS_ERROR_NOT_IMPLEMENTED;
}

/* readonly attribute DOMString gateway; */
NS_IMETHODIMP PrivateNetworkInterface::GetGateway(nsAString & aGateway)
{
  return NS_ERROR_NOT_IMPLEMENTED;
}

/* readonly attribute DOMString dns1; */
NS_IMETHODIMP PrivateNetworkInterface::GetDns1(nsAString & aDns1)
{
  return NS_ERROR_NOT_IMPLEMENTED;
}

/* readonly attribute DOMString dns2; */
NS_IMETHODIMP PrivateNetworkInterface::GetDns2(nsAString & aDns2)
{
  return NS_ERROR_NOT_IMPLEMENTED;
}

/* readonly attribute DOMString httpProxyHost; */
NS_IMETHODIMP PrivateNetworkInterface::GetHttpProxyHost(nsAString & aHttpProxyHost)
{
  return NS_ERROR_NOT_IMPLEMENTED;
}

/* readonly attribute long httpProxyPort; */
NS_IMETHODIMP PrivateNetworkInterface::GetHttpProxyPort(int32_t *aHttpProxyPort)
{
  return NS_ERROR_NOT_IMPLEMENTED;
}

/* Implementation: nsINetworkInterfaceList */
NS_IMPL_ISUPPORTS1(PrivateNetworkInterfaceList, nsINetworkInterfaceList)

/* long getNumberOfInterface (); */
NS_IMETHODIMP PrivateNetworkInterfaceList::GetNumberOfInterface(int32_t *_retval)
{
  if (!_retval) {
    return NS_ERROR_INVALID_ARG;
  }

  *_retval = mInterfaces.Length();
  return NS_OK;
}

/* nsINetworkInterface getInterface (in long interfaceIndex); */
NS_IMETHODIMP PrivateNetworkInterfaceList::GetInterface(int32_t interfaceIndex,
  nsINetworkInterface * *_retval)
{
  if (!_retval || interfaceIndex < 0 || interfaceIndex >= mInterfaces.Length()) {
    return NS_ERROR_INVALID_ARG;
  }

  nsINetworkInterface* interface = mInterfaces[interfaceIndex];
  NS_IF_ADDREF(interface);
  *_retval = interface;
  return NS_OK;
}

#define MAXADDRS 100 // Same as in addrs.c

NS_IMETHODIMP PrivateNetworkInterfaceList::PopulateInterfaces()
{
  struct ifconf ifc;
  int s = socket( AF_INET, SOCK_DGRAM, 0 );
  int len = MAXADDRS * sizeof(struct ifreq);
  int e;
  char *ptr;
  int tl;
  struct ifreq ifr2;

  char buf[len];

  ifc.ifc_len = len;
  ifc.ifc_buf = buf;

  e = ioctl(s, SIOCGIFCONF, &ifc);
  ptr = buf;
  tl = ifc.ifc_len;

  while (tl > 0) {
    struct ifreq* ifr = (struct ifreq *)ptr;

#ifdef LINUX
    int si = sizeof(struct ifreq);
#else
    int si = sizeof(ifr->ifr_name) + MAX(ifr->ifr_addr.sa_len, sizeof(ifr->ifr_addr));
#endif
    tl -= si;
    ptr += si;

    ifr2 = *ifr;

    e = ioctl(s, SIOCGIFADDR, &ifr2);
    if ( e == -1 || ifr2.ifr_addr.sa_family != AF_INET) {
        continue;
    }

    struct sockaddr_in* addr_in = (sockaddr_in*)&ifr2.ifr_addr;
    char addr_str[INET_ADDRSTRLEN + 1];
    inet_ntop(AF_INET, &(addr_in->sin_addr), addr_str, sizeof(addr_str));
    nsINetworkInterface* interface = new PrivateNetworkInterface(addr_str, ifr->ifr_name);
    mInterfaces.AppendObject(interface);
  }

  close(s);

  return NS_OK;
}

/* Implementation: nsINetworkInterfaceListService */
NS_IMPL_ISUPPORTS1(PrivateNetworkInterfaceListService, nsINetworkInterfaceListService)

/* nsINetworkInterfaceList getDataInterfaceList (in long condition); */
NS_IMETHODIMP PrivateNetworkInterfaceListService::GetDataInterfaceList(int32_t condition,
  nsINetworkInterfaceList * *_retval)
{
  if (!_retval) {
    return NS_ERROR_INVALID_ARG;
  }

  nsresult rv;
  rv = CallCreateInstance(LIST_CONTRACTID, _retval);
  NS_IF_ADDREF(*_retval);

  return rv;
}

/* Module */
NS_GENERIC_FACTORY_CONSTRUCTOR(PrivateNetworkInterfaceList)

NS_GENERIC_FACTORY_CONSTRUCTOR(PrivateNetworkInterfaceListService)

NS_DEFINE_NAMED_CID(LIST_CID);

NS_DEFINE_NAMED_CID(SERVICE_CID);

static const mozilla::Module::CIDEntry kCIDs[] = {
  { &kLIST_CID, false, NULL, PrivateNetworkInterfaceListConstructor },
  { &kSERVICE_CID, false, NULL, PrivateNetworkInterfaceListServiceConstructor },
  { nullptr }
};

static const mozilla::Module::ContractIDEntry kContracts[] = {
  { LIST_CONTRACTID, &kLIST_CID },
  { SERVICE_CONTRACTID, &kSERVICE_CID },
  { nullptr }
};

static const mozilla::Module kModule = {
  mozilla::Module::kVersion,
  kCIDs,
  kContracts,
};

/* Register private XPCOM components needed by gonk_addrs.cpp */
void RegisterPrivateNetworkInterfaceListService(void)
{
  XRE_AddStaticComponent(&kModule);
}

#endif // private_nils_h__
