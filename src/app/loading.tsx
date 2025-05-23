"use client";

import React, { useEffect, useState } from "react";

const AnimatedLogo = ({ className = "" }: { className?: string }) => {
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsAnimating(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex justify-center items-center h-screen">
      <svg
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid"
        width="500"
        height="500"
        style={{
          margin: "initial",
          display: "block",
          shapeRendering: "auto",
          background: "rgb(255, 255, 255)",
        }}
      >
        <g
          className="ldl-scale"
          style={{
            transformOrigin: "50% 50%",
            transform: "rotate(0deg) scale(0.8, 0.8)",
          }}
        >
          <g
            className="ldl-ani"
            style={{
              transformBox: "view-box",
              opacity: 1,
              transformOrigin: "50px 80px",
              transform:
                "matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)",
              animation:
                "1s linear 0s infinite normal forwards running animate",
            }}
          >
            <g className="ldl-layer">
              <g className="ldl-ani">
                <image
                  href="data:image/webp;base64,UklGRnYFAABXRUJQVlA4WAoAAAAQAAAAugAAKAAAQUxQSAcDAAABkFbbWl1XRwIOioRIQAIOLg6Kg+AgccBxkDpAQiQgAQnp49ubLwntff2JCAhu20iSlJm9a6CkjtTsEx7/7cME923w7VBF/XVjHp/Wy3dhP5RRb87DATZ428EFbwaiaNnv4/giSOYvh5mSvybDj4Pdiio2OwRBVt8RXoVHM8P/5RBskkKoUiT+hODBY4AAHvkHxBxABDbcvz8gDimoBLRvglu2UrZgVTLRckwUgpxISmSg02C8aBIb8CtyYmd7VmaG/VQdYyUl8vKVmQfiK6rMozHz1mhPyRjaTxmFkGF0f9MtvIHZ0Z6d8pyR2Y8+ZKT8O7blqhhInvxhxoBviVYK3eROJzMfOow0kN0Qvy9PNvAVyl6g4ssNhMQjECpZU1YqOKUMMdij80+EVFfuyBWVY5KzT8Sb/1KU5vZylqMXS6dvJbmHRErlpMxTyCSAjDQRLpGTrEogAxM9KWwT+VxOVV9VC5cIcLZuXMbLFg2GBnQJq5xXC4tilcoTKVT94g1ySPfckmOXBDRcYA+yXyatzMFlPKHAYqgym13aGVzplp1xZFVf/8cu8CA3/EMT4ZQM+hoJ1jzDRBawYzpOlcM0ShfUoZXpZSvB2iXMgKzEHQYGFW4QJhX2lMxLH0c2UyOO+ZOnGKikmUGwcNazyF4nE0DGd3wD7t1JcRGJUGGvycE9hgiyRS6UWYGArILemufnhx353U7pLR0T3EUyFSmkXZsGvH0CpUpguI/5v5fQuYz5Ki6VXicTqUw+JLAGClSf2OCxkbEVLvDV3Iaa+io3weKdh6u0UcrgbNYcl3oAUJkVq08vGFWecUQ3OheWdk8rNHMWsYTzL9qUZ3WvmyIgGGVqnTdpm8hBp7tfTj5xmqd+fz8h89QQeCqF1Q/PDZ1uuPHuFB7nHi2eklkJtchSOcXV67ACMFLlcPWTL5dqNU3lSfJJViWzEpkAlS9manJrrfwNZOH30ZVNz1RYYrf0QetETEpl61POa5yukHGfLtEJKynkPM3EwRt2hZENa84p2Md/7HgAAFZQOCBIAgAAkA4AnQEquwApAD6NPJlHpSOioTAVXACgEYlkAuAD6AEmk1euD4Dl6tvMVeY58n31/6Z/o/YB5UHQM8xf6w/pz723nC74fz8vs9f4/JrE86WTZ4LnaIhUqWN35fXlcbsnLCdzrjwMir9iGBMJK83REhAGgWDDx6oDid1rTAAA/uWHP4qE7Z1Zc51YIZaSDstTP6365FuE0J4DzQZuTgNev/Z9bMVfyUBaxOZfECNYkH62My4ZUoWjtoffZetWAz/8j08WZ4Uq6auUwRl44pVRk5b2d1j2vdptB+bEa2IOBKcwJ/iYxa3qielJWHX5Kmpz7q2jbKY5dbanHcAblCbpfLnEYL/s1V/2LGMWk2467vu5bHIgeaiwuZ46NucWxZfevbZS+flIjn49GI/LLrnHOJD+5j8+1WyfuKntnjDP/AOeOAkxUcWwunLE8ttxBSQ+MWtdJQIuPHSENOxLTjYUWSQ0HNKVzNJ49yXjDTwC8zwBDqZBxBD/0DIk5a4SqR/vWgzJO7/9zzcjNYGWAUPU47FXjG/116uebnbv9u2ZhfeUBFCp/NPwSYa0jpNRr5gVXY+Anh5gVXH2AH9npB7WHq+WgwKOIwC4hEPNaIy+GXLy/eQsf6BVg9ViTKTP3bWEnzKOq+oTLiZfj35Dj6NQW/+Ly3BvWpeIlN60UDnOZu3LUqkxbDvrLFrcE0inNfVcgoNzkRbhd3TaHcTdv0D5cChk2O6HRHh0rwTT9xdV+a3/7Negc0nMXe7R2B0NDKkQqMCgCAAAAAA="
                  height="100"
                  width="100"
                  y="0"
                  x="0"
                />
              </g>
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
};

export default AnimatedLogo;
