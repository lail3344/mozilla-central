/* -*- Mode: C; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4 -*- */
/* vim:expandtab:shiftwidth=4:tabstop=4:
 */
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code mozilla.org code.
 *
 * The Initial Developer of the Original Code Christopher Blizzard
 * <blizzard@mozilla.org>.  Portions created by the Initial Developer
 * are Copyright (C) 2001 the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

#ifndef __MOZ_CONTAINER_H__
#define __MOZ_CONTAINER_H__

#include <gtk/gtkcontainer.h>

struct _MozDrawingarea;

#ifdef __cplusplus
extern "C" {
#endif /* __cplusplus */

#define MOZ_CONTAINER_TYPE            (moz_container_get_type())
#define MOZ_CONTAINER(obj)            (GTK_CHECK_CAST ((obj), MOZ_CONTAINER_TYPE, MozContainer))
#define MOZ_CONTAINER_CLASS(klass)    (GTK_CHECK_CLASS_CAST ((klass), MOZ_CONTAINER_TYPE, MozContainerClass))
#define IS_MOZ_CONTAINER(obj)         (GTK_CHECK_TYPE ((obj), MOZ_CONTAINER_TYPE))
#define IS_MOZ_CONTAINER_CLASS(klass) (GTK_CHECK_CLASS_TYPE ((klass), MOZ_CONTAINER_TYPE))
#define MOZ_CONAINTER_GET_CLASS(obj)  (GTK_CHECK_GET_CLASS ((obj), MOZ_CONTAINER_TYPE, MozContainerClass))

typedef struct _MozContainer      MozContainer;
typedef struct _MozContainerClass MozContainerClass;

struct _MozContainer
{
    GtkContainer   container;
    GList         *children;
    GSList        *drawing_areas;
};

struct _MozContainerClass
{
    GtkContainerClass parent_class;
};

GtkType    moz_container_get_type (void);
GtkWidget *moz_container_new      (void);
void       moz_container_put      (MozContainer *container,
                                   GtkWidget    *child_widget,
                                   gint          x,
                                   gint          y);
void       moz_container_move          (MozContainer *container,
                                        GtkWidget    *child_widget,
                                        gint          x,
                                        gint          y,
                                        gint          width,
                                        gint          height);
void       moz_container_scroll_update (MozContainer *container,
                                        GtkWidget    *child_widget,
                                        gint          x,
                                        gint          y);
GSList*    moz_container_get_drawing_areas (MozContainer *container);
void       moz_container_add_drawing_area (MozContainer *container,
                                           struct _MozDrawingarea *area);
void       moz_container_remove_drawing_area (MozContainer *container,
                                              struct _MozDrawingarea *area);
#ifdef __cplusplus
}
#endif /* __cplusplus */

#endif /* __MOZ_CONTAINER_H__ */
