import React, { useMemo } from 'react';
import { ConversionPath } from '../types';

interface SankeyNode {
    id: string;
    name: string;
    level: number;
    value: number;
}

interface SankeyLink {
    source: string;
    target: string;
    value: number;
}

interface ConversionPathSankeyProps {
    paths: ConversionPath[];
}

export const ConversionPathSankey: React.FC<ConversionPathSankeyProps> = ({ paths }) => {
    // Build Sankey data from conversion paths
    const { nodes, links } = useMemo(() => {
        const nodeMap = new Map<string, SankeyNode>();
        const linkMap = new Map<string, number>();

        // Process each path
        paths.forEach(path => {
            path.touchpoints.forEach((touchpoint, index) => {
                const nodeId = `${touchpoint.channel}_${index}`;

                // Add node
                if (!nodeMap.has(nodeId)) {
                    nodeMap.set(nodeId, {
                        id: nodeId,
                        name: touchpoint.channel,
                        level: index,
                        value: 0
                    });
                }
                const node = nodeMap.get(nodeId)!;
                node.value += 1;

                // Add link to next touchpoint
                if (index < path.touchpoints.length - 1) {
                    const nextNodeId = `${path.touchpoints[index + 1].channel}_${index + 1}`;
                    const linkId = `${nodeId}->${nextNodeId}`;
                    linkMap.set(linkId, (linkMap.get(linkId) || 0) + 1);
                }

                // Add link to conversion
                if (index === path.touchpoints.length - 1) {
                    const conversionNodeId = `CONVERSION_${index + 1}`;
                    if (!nodeMap.has(conversionNodeId)) {
                        nodeMap.set(conversionNodeId, {
                            id: conversionNodeId,
                            name: 'Conversion',
                            level: index + 1,
                            value: 0
                        });
                    }
                    const convNode = nodeMap.get(conversionNodeId)!;
                    convNode.value += 1;

                    const linkId = `${nodeId}->${conversionNodeId}`;
                    linkMap.set(linkId, (linkMap.get(linkId) || 0) + 1);
                }
            });
        });

        const nodes = Array.from(nodeMap.values());
        const links: SankeyLink[] = Array.from(linkMap.entries()).map(([linkId, value]) => {
            const [source, target] = linkId.split('->');
            return { source, target, value };
        });

        return { nodes, links };
    }, [paths]);

    // Group nodes by level
    const nodesByLevel = useMemo(() => {
        const levels = new Map<number, SankeyNode[]>();
        nodes.forEach(node => {
            if (!levels.has(node.level)) {
                levels.set(node.level, []);
            }
            levels.get(node.level)!.push(node);
        });
        return levels;
    }, [nodes]);

    const maxLevel = Math.max(...Array.from(nodesByLevel.keys()));
    const totalPaths = paths.length;

    // Calculate positions
    const width = 800;
    const height = 500;
    const nodeWidth = 20;
    const levelPadding = (width - nodeWidth) / Math.max(1, maxLevel);

    const getNodePosition = (node: SankeyNode) => {
        const levelNodes = nodesByLevel.get(node.level) || [];
        const nodeIndex = levelNodes.indexOf(node);
        const levelHeight = height / Math.max(1, levelNodes.length + 1);

        return {
            x: node.level * levelPadding,
            y: levelHeight * (nodeIndex + 1),
            height: Math.max(20, (node.value / totalPaths) * 100)
        };
    };

    // Get channel color
    const getChannelColor = (name: string) => {
        if (name === 'Conversion') return 'rgb(34, 197, 94)'; // green

        const colors: Record<string, string> = {
            'Google Ads': 'rgb(59, 130, 246)',
            'Meta': 'rgb(236, 72, 153)',
            'Microsoft Ads': 'rgb(14, 165, 233)',
            'TikTok': 'rgb(168, 85, 247)',
            'LinkedIn': 'rgb(99, 102, 241)',
            'Google Display Network': 'rgb(147, 51, 234)',
            'The Trade Desk': 'rgb(249, 115, 22)',
            'Taboola': 'rgb(234, 179, 8)',
        };

        // Find matching color or generate based on hash
        for (const [key, color] of Object.entries(colors)) {
            if (name.includes(key)) return color;
        }

        // Default colors
        const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const hue = hash % 360;
        return `hsl(${hue}, 70%, 50%)`;
    };

    if (paths.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
                <p className="text-gray-600 dark:text-gray-400">No conversion paths to visualize</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Conversion Path Flow</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Sankey diagram showing touchpoint sequences across {paths.length} conversions
                </p>
            </div>

            <div className="overflow-x-auto">
                <svg width={width} height={height} className="mx-auto">
                    {/* Draw links */}
                    {links.map((link, i) => {
                        const sourceNode = nodes.find(n => n.id === link.source);
                        const targetNode = nodes.find(n => n.id === link.target);

                        if (!sourceNode || !targetNode) return null;

                        const sourcePos = getNodePosition(sourceNode);
                        const targetPos = getNodePosition(targetNode);

                        const linkHeight = Math.max(2, (link.value / totalPaths) * 50);

                        const path = `
                            M ${sourcePos.x + nodeWidth} ${sourcePos.y + sourcePos.height / 2}
                            C ${sourcePos.x + nodeWidth + levelPadding / 2} ${sourcePos.y + sourcePos.height / 2},
                              ${targetPos.x - levelPadding / 2} ${targetPos.y + targetPos.height / 2},
                              ${targetPos.x} ${targetPos.y + targetPos.height / 2}
                        `;

                        const color = getChannelColor(sourceNode.name);

                        return (
                            <path
                                key={i}
                                d={path}
                                stroke={color}
                                strokeWidth={linkHeight}
                                fill="none"
                                opacity={0.3}
                            >
                                <title>{`${sourceNode.name} → ${targetNode.name}: ${link.value} paths`}</title>
                            </path>
                        );
                    })}

                    {/* Draw nodes */}
                    {nodes.map(node => {
                        const pos = getNodePosition(node);
                        const color = getChannelColor(node.name);

                        return (
                            <g key={node.id}>
                                <rect
                                    x={pos.x}
                                    y={pos.y}
                                    width={nodeWidth}
                                    height={pos.height}
                                    fill={color}
                                    rx={2}
                                >
                                    <title>{`${node.name}: ${node.value} paths`}</title>
                                </rect>
                                <text
                                    x={pos.x + nodeWidth + 5}
                                    y={pos.y + pos.height / 2}
                                    fontSize={12}
                                    fill="currentColor"
                                    className="text-gray-700 dark:text-gray-300"
                                    dominantBaseline="middle"
                                >
                                    {node.name} ({node.value})
                                </text>
                            </g>
                        );
                    })}
                </svg>
            </div>

            <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                <p>Width of flows represents number of conversion paths. Touchpoints are grouped by position in journey.</p>
            </div>
        </div>
    );
};
