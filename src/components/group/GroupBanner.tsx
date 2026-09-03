import { Camera, Trash2 } from 'lucide-react';
import { useTranslation } from 'next-i18next';
import Image from 'next/image';
import React, { useCallback, useEffect, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { toast } from 'sonner';

import { EntityAvatar } from '~/components/ui/avatar';
import { Button } from '~/components/ui/button';
import { AppDrawer } from '~/components/ui/drawer';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Slider } from '~/components/ui/slider';
import { useAppStore } from '~/store/appStore';
import { api } from '~/utils/api';
import {
  prepareImageForUpload,
  toImageSrc,
  uploadImage,
  validateUploadSize,
} from '~/utils/imageUpload';

/** Width / height ratio of the banner. Uploads are resized to 1200px wide, i.e. 1200x400. */
const BANNER_ASPECT = 3;

// Copied from `Account/UpdateDetails.tsx` (module-private there) to keep the upstream diff at zero.
const createImage = async (url: string) => {
  // `Image` is shadowed by the next/image import: use the DOM element directly.
  const image = document.createElement('img');
  image.crossOrigin = 'anonymous';
  image.src = url;

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('Failed to load image for cropping'));
  });

  return image;
};

const getCroppedImage = async (imageSrc: string, pixelCrop: Area) => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Cannot get canvas context');
  }

  context.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  );

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas toBlob returned null'));
          return;
        }

        resolve(blob);
      },
      'image/jpeg',
      0.9,
    );
  });
};

interface GroupBannerProps {
  group?: {
    id: number;
    name: string;
    image?: string | null;
    bannerImage?: string | null;
  } | null;
  onSaved: () => unknown;
}

/**
 * Custom fork: banner image displayed at the top of the group page, editable by any member.
 * Reuses the local upload pipeline (`/api/upload` + `/api/files`) used for avatars and receipts.
 */
export const GroupBanner: React.FC<GroupBannerProps> = ({ group, onSaved }) => {
  const { t } = useTranslation();
  const maxUploadFileSizeMB = useAppStore((s) => s.maxUploadFileSizeMB);
  const updateGroupDetails = api.group.updateGroupDetails.useMutation();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(
    () => () => {
      if (imageSrc?.startsWith('blob:')) {
        URL.revokeObjectURL(imageSrc);
      }
    },
    [imageSrc],
  );

  const resetCrop = useCallback(() => {
    setImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  }, []);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setDrawerOpen(open);
      if (!open) {
        resetCrop();
      }
    },
    [resetCrop],
  );

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = event.target.files?.[0];
      if (!selectedFile) {
        return;
      }

      resetCrop();
      setImageSrc(URL.createObjectURL(selectedFile));
      event.target.value = '';
    },
    [resetCrop],
  );

  const saveBanner = useCallback(
    async (bannerImage: string | null) => {
      if (!group) {
        return;
      }

      // The upstream mutation always writes name/image, so pass the current values along.
      await updateGroupDetails.mutateAsync({
        groupId: group.id,
        name: group.name,
        image: group.image,
        bannerImage,
      });
      toast.success(t('group_details.messages.banner_updated'), { duration: 1500 });
      await onSaved();
    },
    [group, onSaved, t, updateGroupDetails],
  );

  const handleSave = useCallback(async () => {
    if (!imageSrc || !croppedAreaPixels) {
      return;
    }

    setSaving(true);
    try {
      const croppedBlob = await getCroppedImage(imageSrc, croppedAreaPixels);
      let croppedFile = new File([croppedBlob], 'banner.jpg', { type: 'image/jpeg' });

      try {
        croppedFile = await prepareImageForUpload(croppedFile, maxUploadFileSizeMB);
      } catch (error) {
        console.error('Compression failed:', error);
        toast.error(t('errors.image_compression_failed'));
      }

      if (!validateUploadSize(croppedFile, maxUploadFileSizeMB)) {
        toast.error(t('errors.less_than', { size: maxUploadFileSizeMB }));
        return;
      }

      const key = await uploadImage(croppedFile);
      await saveBanner(key);
      handleOpenChange(false);
    } catch (error) {
      console.error('Banner upload error:', error);
      toast.error(t('errors.uploading_error'));
    } finally {
      setSaving(false);
    }
  }, [croppedAreaPixels, handleOpenChange, imageSrc, maxUploadFileSizeMB, saveBanner, t]);

  const handleRemove = useCallback(async () => {
    setSaving(true);
    try {
      await saveBanner(null);
      handleOpenChange(false);
    } catch (error) {
      console.error('Banner removal error:', error);
      toast.error(t('errors.group_name_update_failed'));
    } finally {
      setSaving(false);
    }
  }, [handleOpenChange, saveBanner, t]);

  if (!group) {
    return null;
  }

  const bannerSrc = toImageSrc(group.bannerImage);

  return (
    <div className="relative w-full lg:mt-4">
      {bannerSrc ? (
        <div className="relative aspect-[3/1] max-h-64 w-full overflow-hidden lg:rounded-xl">
          {/* Unoptimized: `/api/files` is session-gated, so the image optimizer could not fetch it. */}
          <Image
            src={bannerSrc}
            alt={group.name}
            fill
            unoptimized
            sizes="(min-width: 1024px) 768px, 100vw"
            className="object-cover"
          />
        </div>
      ) : (
        <div className="from-primary/30 to-secondary flex h-24 w-full items-center justify-center bg-linear-to-r lg:rounded-xl">
          <EntityAvatar entity={group} size={56} />
        </div>
      )}

      <AppDrawer
        trigger={
          <Button
            variant="ghost"
            size="icon"
            aria-label={t('group_details.group_info.change_banner')}
            className="absolute right-3 bottom-3 size-9 rounded-full bg-black/40 text-white hover:bg-black/60 hover:text-white"
          >
            <Camera className="size-5" />
          </Button>
        }
        open={drawerOpen}
        onOpenChange={handleOpenChange}
        title={t('group_details.group_info.banner')}
        leftAction={t('actions.close')}
        actionTitle={t('actions.save')}
        actionOnClick={handleSave}
        actionDisabled={!imageSrc || saving}
        shouldCloseOnAction={false}
        className="h-[80vh]"
      >
        <div className="mt-2 flex flex-col gap-6">
          {imageSrc ? (
            <div className="space-y-3">
              <div className="relative h-56 w-full overflow-hidden rounded-lg bg-black/5">
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={BANNER_ASPECT}
                  cropShape="rect"
                  showGrid={false}
                  onCropChange={setCrop}
                  onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
                  onZoomChange={setZoom}
                />
              </div>
              <div className="px-2">
                <Label className="mb-4 block" htmlFor="banner-zoom-slider">
                  {t('account.edit_name.zoom')}
                </Label>
                <Slider
                  id="banner-zoom-slider"
                  min={1}
                  max={3}
                  step={0.1}
                  value={[zoom]}
                  onValueChange={(val) => setZoom(val[0] ?? 1)}
                />
              </div>
            </div>
          ) : bannerSrc ? (
            <div className="relative aspect-[3/1] w-full overflow-hidden rounded-lg">
              <Image src={bannerSrc} alt={group.name} fill unoptimized className="object-cover" />
            </div>
          ) : (
            <div className="bg-muted text-muted-foreground flex aspect-[3/1] w-full items-center justify-center rounded-lg text-sm">
              {t('group_details.group_info.no_banner')}
            </div>
          )}

          <p className="text-muted-foreground text-sm">
            {t('group_details.group_info.banner_hint')}
          </p>

          <div className="flex items-center justify-between gap-4">
            <Label
              htmlFor="group-banner-input"
              className="text-primary flex cursor-pointer items-center gap-2"
            >
              <Camera className="size-5" />
              {t('group_details.group_info.select_banner')}
              <Input
                onChange={handleFileChange}
                id="group-banner-input"
                type="file"
                accept="image/*"
                className="hidden"
              />
            </Label>

            <Button
              variant="ghost"
              className="text-destructive flex items-center gap-2"
              disabled={!group.bannerImage || saving}
              onClick={handleRemove}
            >
              <Trash2 className="size-5" />
              {t('group_details.group_info.remove_banner')}
            </Button>
          </div>
        </div>
      </AppDrawer>
    </div>
  );
};
