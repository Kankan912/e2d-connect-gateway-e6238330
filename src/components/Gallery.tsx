import { Image as ImageIcon, Play, Folder } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useSiteGallery, useSiteGalleryAlbums } from "@/hooks/useSiteContent";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const Gallery = () => {
  const { data: albums, isLoading: loadingAlbums } = useSiteGalleryAlbums();
  const { data: galleryItems, isLoading: loadingItems } = useSiteGallery();
  const [selectedAlbum, setSelectedAlbum] = useState<any>(null);

  const isLoading = loadingAlbums || loadingItems;

  if (isLoading) {
    return (
      <section id="galerie" className="py-20 lg:py-32 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Skeleton className="h-8 w-48 mx-auto mb-4" />
            <Skeleton className="h-12 w-96 mx-auto" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="aspect-square" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Get items for selected album
  const albumItems = selectedAlbum
    ? galleryItems?.filter((item: any) => item.album_id === selectedAlbum.id) || []
    : [];

  // Get items without album (for default view)
  const itemsWithoutAlbum = galleryItems?.filter((item: any) => !item.album_id) || [];

  return (
    <section id="galerie" className="py-20 lg:py-32 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            Galerie
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Revivez Nos Meilleurs Moments
          </h2>
          <p className="text-lg text-muted-foreground">
            Découvrez en images et en vidéos les moments forts qui font la richesse de notre association.
          </p>
        </div>

        {/* Albums Grid */}
        {albums && albums.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {albums.map((album: any) => {
              const albumItemsCount = galleryItems?.filter((item: any) => item.album_id === album.id).length || 0;
              const coverImage = album.cover_image_url || 
                                galleryItems?.find((item: any) => item.album_id === album.id)?.image_url;
              
              return (
                <div
                  key={album.id}
                  onClick={() => setSelectedAlbum(album)}
                  className="group relative aspect-square rounded-xl overflow-hidden shadow-soft hover:shadow-strong transition-all duration-300 cursor-pointer"
                >
                  {coverImage ? (
                    <img
                      src={coverImage}
                      alt={album.titre}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                      <Folder className="w-16 h-16 text-muted-foreground/30" />
                    </div>
                  )}
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <h3 className="text-white font-semibold mb-1">{album.titre}</h3>
                    <p className="text-white/80 text-sm">{albumItemsCount} élément{albumItemsCount > 1 ? 's' : ''}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        {/* Items without album */}
        {itemsWithoutAlbum.length > 0 && (
          <>
            <h3 className="text-2xl font-bold text-foreground mb-6">Tous les médias</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {itemsWithoutAlbum.map((item: any) => {
                const isVideo = item.categorie?.toLowerCase() === "vidéo" || item.video_url;
                const mediaUrl = item.image_url || item.video_url;
                
                return (
                  <div
                    key={item.id}
                    className="group relative aspect-square rounded-xl overflow-hidden shadow-soft hover:shadow-strong transition-all duration-300 cursor-pointer"
                  >
                    {mediaUrl ? (
                      <>
                        {isVideo ? (
                          <div className="w-full h-full relative">
                          <img
                            src={mediaUrl}
                            alt={item.titre}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Play className="w-16 h-16 text-white/80" />
                            </div>
                          </div>
                        ) : (
                          <img
                            src={mediaUrl}
                            alt={item.titre}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                        {isVideo ? (
                          <Play className="w-16 h-16 text-muted-foreground/30" />
                        ) : (
                          <ImageIcon className="w-16 h-16 text-muted-foreground/30" />
                        )}
                      </div>
                    )}
                    
                    <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                      <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-secondary text-white mb-2">
                        {item.categorie}
                      </span>
                      <h3 className="text-white font-semibold">{item.titre}</h3>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">Plus de photos et vidéos disponibles sur nos réseaux sociaux</p>
          <button
            onClick={() => window.open("https://www.facebook.com/phoenixkmra/", "_blank")}
            className="inline-flex items-center px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Suivez-nous sur Facebook
          </button>
        </div>
      </div>

      {/* Album Detail Dialog */}
      <Dialog open={!!selectedAlbum} onOpenChange={() => setSelectedAlbum(null)}>
        <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{selectedAlbum?.titre}</DialogTitle>
            {selectedAlbum?.description && (
              <p className="text-muted-foreground">{selectedAlbum.description}</p>
            )}
          </DialogHeader>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {albumItems.map((item: any) => {
              const isVideo = item.categorie?.toLowerCase() === "vidéo" || item.video_url;
              const mediaUrl = item.image_url || item.video_url;
              
              return (
                <div
                  key={item.id}
                  className="group relative aspect-square rounded-lg overflow-hidden shadow-soft hover:shadow-strong transition-all duration-300"
                >
                  {mediaUrl ? (
                    <>
                      {isVideo ? (
                        <div className="w-full h-full relative">
                          <img
                            src={mediaUrl}
                            alt={item.titre}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Play className="w-12 h-12 text-white/80" />
                          </div>
                        </div>
                      ) : (
                        <img
                          src={mediaUrl}
                          alt={item.titre}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                      {isVideo ? (
                        <Play className="w-12 h-12 text-muted-foreground/30" />
                      ) : (
                        <ImageIcon className="w-12 h-12 text-muted-foreground/30" />
                      )}
                    </div>
                  )}
                  
                  <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <h4 className="text-white font-semibold text-sm">{item.titre}</h4>
                  </div>
                </div>
              );
            })}
          </div>
          
          {albumItems.length === 0 && (
            <p className="text-center text-muted-foreground py-12">
              Aucun média dans cet album.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default Gallery;
