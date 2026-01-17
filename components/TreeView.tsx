
import React, { useEffect, useRef, useMemo } from 'react';
import { 
  select, 
  zoom, 
  tree, 
  hierarchy, 
  linkVertical, 
  zoomIdentity,
  HierarchyPointLink,
  HierarchyPointNode
} from 'd3';
import { Person, FamilyHierarchyNode } from '../types';

interface TreeViewProps {
  people: Person[];
  onSelectPerson: (person: Person) => void;
}

const TreeView: React.FC<TreeViewProps> = ({ people, onSelectPerson }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const hierarchyData = useMemo(() => {
    if (people.length === 0) return null;

    const findChildren = (parentId: string): FamilyHierarchyNode[] => {
      return people
        .filter(p => p.fatherId === parentId || p.motherId === parentId)
        .map(p => ({
          person: p,
          children: findChildren(p.id)
        }));
    };

    const roots = people.filter(p => !p.fatherId && !p.motherId);
    const primaryRoot = roots.length > 0 ? roots[0] : people[0];

    return {
      person: primaryRoot,
      children: findChildren(primaryRoot.id)
    } as FamilyHierarchyNode;
  }, [people]);

  const downloadImage = () => {
    if (!svgRef.current) return;
    
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const canvas = document.createElement("canvas");
    const svgSize = svgRef.current.getBBox();
    const margin = 50;
    
    canvas.width = svgSize.width + margin * 2;
    canvas.height = svgSize.height + margin * 2;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.fillStyle = "#f8fafc"; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    
    img.onload = () => {
      ctx.drawImage(img, margin - svgSize.x, margin - svgSize.y);
      const pngUrl = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `Family_Tree_${new Date().getFullYear()}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !hierarchyData) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const svg = select<SVGSVGElement, unknown>(svgRef.current);
    svg.selectAll("*").remove();

    const defs = svg.append("defs");
    // Standard clipPath for avatars
    defs.append("clipPath")
      .attr("id", "avatar-clip-tree")
      .append("circle")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", 22);

    const g = svg.append("g");

    const zoomBehavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoomBehavior);

    const treeLayout = tree<FamilyHierarchyNode>()
      .nodeSize([260, 200]); // Increased spacing slightly

    const root = hierarchy(hierarchyData);
    treeLayout(root);

    g.append("g")
      .attr("fill", "none")
      .attr("stroke", "#cbd5e1")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", 2)
      .selectAll("path")
      .data(root.links())
      .join("path")
      .attr("d", linkVertical<HierarchyPointLink<FamilyHierarchyNode>, HierarchyPointNode<FamilyHierarchyNode>>()
        .x(d => d.x)
        .y(d => d.y));

    const node = g.append("g")
      .selectAll("g")
      .data(root.descendants())
      .join("g")
      .attr("transform", d => `translate(${d.x},${d.y})`)
      .style("cursor", "pointer")
      .on("click", (event, d) => onSelectPerson(d.data.person));

    const cardWidth = 200; // Increased from 180 to 200
    const cardHeight = 70;

    // Background Card
    node.append("rect")
      .attr("x", -cardWidth / 2)
      .attr("y", -cardHeight / 2)
      .attr("width", cardWidth)
      .attr("height", cardHeight)
      .attr("rx", 12)
      .attr("fill", "white")
      .attr("stroke", d => d.data.person.gender === 'Male' ? '#3b82f6' : '#f43f5e')
      .attr("stroke-width", 2.5)
      .attr("class", "shadow-sm");

    // Avatar Group
    const avatarG = node.append("g")
      .attr("transform", `translate(${-cardWidth / 2 + 35}, 0)`);

    avatarG.append("circle")
      .attr("r", 23)
      .attr("fill", "#f8fafc")
      .attr("stroke", "#e2e8f0")
      .attr("stroke-width", 1);

    avatarG.append("image")
      .attr("href", d => d.data.person.photoUrl || `https://picsum.photos/seed/${d.data.person.id}/100/100`)
      .attr("x", -22)
      .attr("y", -22)
      .attr("width", 44)
      .attr("height", 44)
      .attr("clip-path", "url(#avatar-clip-tree)")
      .attr("preserveAspectRatio", "xMidYMid slice");

    // Text Content
    const textX = -cardWidth / 2 + 70;

    // Name - Truncated if too long
    node.append("text")
      .attr("x", textX)
      .attr("y", -5)
      .attr("dy", "0.31em")
      .attr("font-size", "13px")
      .attr("font-weight", "700")
      .attr("fill", "#1e293b")
      .text(d => {
        const full = `${d.data.person.firstName} ${d.data.person.lastName}`;
        return full.length > 20 ? full.substring(0, 18) + '...' : full;
      });

    // Subtitle
    node.append("text")
      .attr("x", textX)
      .attr("y", 15)
      .attr("font-size", "11px")
      .attr("font-weight", "500")
      .attr("fill", "#64748b")
      .text(d => {
        const birthYear = new Date(d.data.person.birthDate).getFullYear();
        const deathYear = d.data.person.deathDate ? new Date(d.data.person.deathDate).getFullYear() : null;
        return deathYear ? `${birthYear} — ${deathYear}` : `b. ${birthYear}`;
      });

    const initialTransform = zoomIdentity.translate(width / 2, 80).scale(0.8);
    svg.call(zoomBehavior.transform, initialTransform);

  }, [hierarchyData, onSelectPerson]);

  return (
    <div ref={containerRef} className="w-full h-full bg-slate-50 relative overflow-hidden rounded-2xl border border-slate-200 shadow-inner">
      <svg ref={svgRef} className="w-full h-full" />
      
      <div className="absolute top-6 right-6 flex flex-col gap-2">
        <button 
          onClick={downloadImage}
          className="bg-white hover:bg-slate-50 text-slate-700 p-3 rounded-xl shadow-lg border border-slate-200 transition-all flex items-center gap-2 group active:scale-95"
          title="Download as PNG"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span className="text-xs font-bold uppercase tracking-tight pr-1">Export Tree</span>
        </button>
      </div>

      <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl text-[11px] font-bold text-slate-500 border border-slate-200 shadow-sm flex items-center gap-3 uppercase tracking-wider">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-500"></span> Male
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-500"></span> Female
        </div>
        <span className="mx-1 text-slate-300">|</span>
        <div className="flex items-center gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
          </svg>
          Interactive View
        </div>
      </div>
    </div>
  );
};

export default TreeView;
